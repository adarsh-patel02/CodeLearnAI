import os
from collections import defaultdict

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")
OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset.csv")

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGODB_DB") or os.getenv("MONGO_DB_NAME")

if not MONGO_URI:
    raise ValueError("MONGO_URI or MONGODB_URI is missing in backend/.env")


def resolve_database(client):
    if DB_NAME:
        return client[DB_NAME]
    default_db = client.get_default_database()
    if default_db is None:
        raise ValueError(
            "Could not determine database name from MONGO_URI. "
            "Please add DB_NAME to backend/.env"
        )
    return default_db


def event_time(document):
    return document.get("occurredAt") or document.get("createdAt")


def before_assessment(document, assessment_time):
    timestamp = event_time(document)
    if assessment_time is None or timestamp is None:
        return assessment_time is None
    return timestamp <= assessment_time


def latest_no_ai_target(records):
    """Use the latest scored NO-AI submission for each learner/original-task pair."""
    scored = [
        record
        for record in records
        if record.get("correctnessScore") is not None
    ]
    if not scored:
        return None
    scored.sort(key=lambda item: event_time(item) or pd.Timestamp.min.to_pydatetime())
    return scored[-1]


def build_row(learner_id, task_id, submissions, interactions, target_score):
    submissions = sorted(
        submissions,
        key=lambda item: event_time(item) or pd.Timestamp.min.to_pydatetime(),
    )

    correctness_scores = [
        float(item["correctnessScore"])
        for item in submissions
        if item.get("correctnessScore") is not None
    ]
    if not correctness_scores:
        return None

    runtimes = [
        float(item["executionTimeMs"])
        for item in submissions
        if item.get("executionTimeMs") is not None
    ]
    code_lengths = [len(item.get("code") or "") for item in submissions]
    assistance_types = [item.get("assistanceType") for item in interactions]

    first_score = correctness_scores[0]
    final_score = correctness_scores[-1]

    return {
        "learner_id": str(learner_id),
        "task_id": str(task_id),
        "ai_submission_count": len(submissions),
        "ai_first_correctness": first_score,
        "ai_mean_correctness": sum(correctness_scores) / len(correctness_scores),
        "ai_best_correctness": max(correctness_scores),
        "ai_final_correctness": final_score,
        "ai_correctness_improvement": final_score - first_score,
        "ai_correctness_std": (
            float(pd.Series(correctness_scores).std(ddof=0))
            if len(correctness_scores) > 1
            else 0.0
        ),
        "ai_runtime_error_count": sum(
            1 for item in submissions if item.get("executionStatus") == "ERROR"
        ),
        "ai_mean_code_length": (
            sum(code_lengths) / len(code_lengths) if code_lengths else 0.0
        ),
        "ai_mean_execution_time_ms": (
            sum(runtimes) / len(runtimes) if runtimes else 0.0
        ),
        "ai_interaction_count": len(interactions),
        "hint_count": assistance_types.count("HINT"),
        "debugging_count": assistance_types.count("DEBUGGING"),
        "code_generation_count": assistance_types.count("DIRECT_CODE_GENERATION"),
        "direct_solution_count": assistance_types.count("DIRECT_SOLUTION"),
        "conceptual_explanation_count": assistance_types.count("CONCEPTUAL_EXPLANATION"),
        "target_no_ai_score": float(target_score),
    }


def main():
    client = MongoClient(MONGO_URI)
    try:
        db = resolve_database(client)
        code_executions = db["codeexecutions"]
        ai_interactions = db["aiinteractions"]

        ai_submissions = list(
            code_executions.find(
                {
                    "assessmentMode": "AI_ASSISTED",
                    "runType": "SUBMISSION",
                }
            )
        )

        no_ai_submissions = list(
            code_executions.find(
                {
                    "assessmentMode": "NO_AI",
                    "runType": "SUBMISSION",
                    "pairedTaskId": {"$exists": True, "$ne": None},
                    "correctnessScore": {"$exists": True, "$ne": None},
                }
            )
        )

        print(f"AI-assisted submissions found: {len(ai_submissions)}")
        print(f"Paired NO-AI submissions found: {len(no_ai_submissions)}")

        # Group all NO-AI records by learner + original AI task.
        no_ai_groups = defaultdict(list)
        for record in no_ai_submissions:
            learner_id = record.get("learnerId")
            paired_task_id = record.get("pairedTaskId")
            if learner_id is None or paired_task_id is None:
                continue
            no_ai_groups[(str(learner_id), str(paired_task_id))].append(record)

        # Group AI submissions by learner + original task.
        ai_groups = defaultdict(list)
        for record in ai_submissions:
            learner_id = record.get("learnerId")
            task_id = record.get("taskId")
            if learner_id is None or task_id is None:
                continue
            ai_groups[(str(learner_id), str(task_id))].append(record)

        all_interactions = list(ai_interactions.find({}))
        interaction_groups = defaultdict(list)
        for record in all_interactions:
            learner_id = record.get("learnerId")
            task_id = record.get("taskId")
            if learner_id is None or task_id is None:
                continue
            interaction_groups[(str(learner_id), str(task_id))].append(record)

        dataset_rows = []
        for key, submissions in ai_groups.items():
            if key not in no_ai_groups:
                continue

            # The target used for training is the final scored NO-AI result.
            no_ai_target = latest_no_ai_target(no_ai_groups[key])
            if no_ai_target is None:
                continue

            assessment_time = event_time(no_ai_target)
            # Only evidence available by the assessment time is allowed.
            filtered_submissions = [
                item for item in submissions
                if before_assessment(item, assessment_time)
            ]
            filtered_interactions = [
                item for item in interaction_groups.get(key, [])
                if before_assessment(item, assessment_time)
            ]

            row = build_row(
                learner_id=key[0],
                task_id=key[1],
                submissions=filtered_submissions,
                interactions=filtered_interactions,
                target_score=no_ai_target["correctnessScore"],
            )
            if row is not None:
                row["no_ai_execution_id"] = str(no_ai_target.get("_id"))
                row["assessment_time"] = assessment_time
                dataset_rows.append(row)

        df = pd.DataFrame(dataset_rows)
        df.to_csv(OUTPUT_PATH, index=False)

        print("\n======================================")
        print("Dataset created successfully")
        print("======================================")
        print(f"Dataset path: {OUTPUT_PATH}")
        print(f"Matched training rows: {len(df)}")

        if df.empty:
            print("WARNING: No matched learner-task pairs found.")
            return

        print(f"Unique learners: {df['learner_id'].nunique()}")
        print(f"Unique learner-task pairs: {len(df)}")
        print("Target column: target_no_ai_score")
        print("\nTarget distribution:")
        print(df["target_no_ai_score"].describe())
        print("\nExcluded from model inputs:")
        print(" - learner_id")
        print(" - task_id")
        print(" - no_ai_execution_id")
        print(" - assessment_time")
        print(" - target_no_ai_score")
        print("\nTemporal rule: AI evidence must be available at or before the NO-AI assessment.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
