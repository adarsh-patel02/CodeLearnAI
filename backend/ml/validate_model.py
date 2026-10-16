import json
import os
import sys
from math import sqrt
from statistics import mean, stdev

import joblib
import pandas as pd
from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
MODEL_PATH = os.path.join(BASE_DIR, "competency_model.joblib")
OUTPUT_PATH = os.path.join(BASE_DIR, "validation_results.csv")

load_dotenv(os.path.join(BACKEND_DIR, ".env"))


def get_database():
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    db_name = os.getenv("DB_NAME") or os.getenv("MONGODB_DB")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI or MONGODB_URI is not configured")
    if not db_name:
        try:
            db_name = mongo_uri.rsplit("/", 1)[1].split("?", 1)[0]
        except Exception:
            db_name = "codelearnai"
    client = MongoClient(mongo_uri)
    return client[db_name]


def safe_mean(values):
    return mean(values) if values else 0.0


def safe_std(values):
    return stdev(values) if len(values) > 1 else 0.0


def to_object_id(value):
    try:
        return ObjectId(value)
    except Exception:
        return value


def event_time(document):
    return document.get("occurredAt") or document.get("createdAt")


def before_assessment(document, assessment_time):
    timestamp = event_time(document)
    if assessment_time is None or timestamp is None:
        # Keep legacy records that have no timestamp, but prefer timestamped data.
        return assessment_time is None
    return timestamp <= assessment_time


def extract_features(db, learner_id, task_id, assessment_time):
    query = {
        "learnerId": learner_id,
        "taskId": task_id,
        "assessmentMode": "AI_ASSISTED",
        "runType": "SUBMISSION",
    }
    submissions = [
        item
        for item in db.codeexecutions.find(query).sort("occurredAt", 1)
        if before_assessment(item, assessment_time)
    ]

    if not submissions:
        return None

    interactions = [
        item
        for item in db.aiinteractions.find({"learnerId": learner_id, "taskId": task_id})
        if before_assessment(item, assessment_time)
    ]

    correctness = [
        float(item["correctnessScore"])
        for item in submissions
        if item.get("correctnessScore") is not None
    ]
    runtimes = [
        float(item["executionTimeMs"])
        for item in submissions
        if item.get("executionTimeMs") is not None
    ]
    code_lengths = [len(item.get("code", "")) for item in submissions]
    assistance_types = [item.get("assistanceType") for item in interactions]

    first_correctness = correctness[0] if correctness else 0.0
    final_correctness = correctness[-1] if correctness else 0.0

    return {
        "ai_submission_count": len(submissions),
        "ai_first_correctness": first_correctness,
        "ai_mean_correctness": safe_mean(correctness),
        "ai_best_correctness": max(correctness) if correctness else 0.0,
        "ai_final_correctness": final_correctness,
        "ai_correctness_improvement": final_correctness - first_correctness,
        "ai_correctness_std": safe_std(correctness),
        "ai_runtime_error_count": sum(
            1 for item in submissions if item.get("executionStatus") == "ERROR"
        ),
        "ai_mean_code_length": safe_mean(code_lengths),
        "ai_mean_execution_time_ms": safe_mean(runtimes),
        "ai_interaction_count": len(interactions),
        "hint_count": assistance_types.count("HINT"),
        "debugging_count": assistance_types.count("DEBUGGING"),
        "code_generation_count": assistance_types.count("DIRECT_CODE_GENERATION"),
        "direct_solution_count": assistance_types.count("DIRECT_SOLUTION"),
        "conceptual_explanation_count": assistance_types.count("CONCEPTUAL_EXPLANATION"),
    }


def find_pairs(db):
    pairs = []
    cursor = db.codeexecutions.find(
        {
            "assessmentMode": "NO_AI",
            "runType": "SUBMISSION",
            "pairedTaskId": {"$exists": True, "$ne": None},
            "correctnessScore": {"$exists": True, "$ne": None},
        }
    )

    for no_ai in cursor:
        learner_id = no_ai.get("learnerId")
        original_task_id = no_ai.get("pairedTaskId")
        if learner_id is None or original_task_id is None:
            continue

        original_task_id = to_object_id(original_task_id)
        assessment_time = event_time(no_ai)
        features = extract_features(db, learner_id, original_task_id, assessment_time)
        if features is None:
            continue

        pairs.append(
            {
                "learner_id": str(learner_id),
                "task_id": str(original_task_id),
                "no_ai_execution_id": str(no_ai.get("_id")),
                "target_no_ai_score": float(no_ai["correctnessScore"]),
                "assessment_time": assessment_time,
                **features,
            }
        )

    return pairs


def validate():
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            "competency_model.joblib is missing. Place the trained model in backend/ml/ first."
        )

    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]
    feature_columns = artifact["feature_columns"]
    feature_columns = [c for c in feature_columns if c != "target_no_ai_score"]

    db = get_database()
    pairs = find_pairs(db)
    if not pairs:
        raise RuntimeError("No valid AI-assisted / NO_AI pairs were found.")

    rows = []
    predictions = []
    actuals = []

    for pair in pairs:
        row = {column: pair.get(column, 0.0) for column in feature_columns}
        frame = pd.DataFrame([row], columns=feature_columns)
        prediction = float(model.predict(frame)[0])
        prediction = max(0.0, min(100.0, prediction))
        actual = pair["target_no_ai_score"]
        error = abs(prediction - actual)

        rows.append(
            {
                "learner_id": pair["learner_id"],
                "task_id": pair["task_id"],
                "no_ai_execution_id": pair["no_ai_execution_id"],
                "predicted_no_ai_score": round(prediction, 4),
                "actual_no_ai_score": round(actual, 4),
                "absolute_error": round(error, 4),
            }
        )
        predictions.append(prediction)
        actuals.append(actual)

    results = pd.DataFrame(rows)
    results.to_csv(OUTPUT_PATH, index=False)

    mae = mean_absolute_error(actuals, predictions)
    rmse = sqrt(mean_squared_error(actuals, predictions))
    r2 = r2_score(actuals, predictions) if len(actuals) >= 2 else None

    return {
        "pairs_evaluated": len(rows),
        "unique_learners": results["learner_id"].nunique(),
        "unique_tasks": results["task_id"].nunique(),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2": None if r2 is None else round(float(r2), 4),
        "results_file": OUTPUT_PATH,
        "temporal_filter": "AI evidence at or before NO_AI assessment time",
    }


def main():
    try:
        summary = validate()
        print(json.dumps(summary, indent=2))
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
