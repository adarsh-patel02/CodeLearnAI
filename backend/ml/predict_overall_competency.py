import json
import os
import sys
from statistics import mean, stdev

import joblib
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(BASE_DIR)
MODEL_PATH = os.path.join(BASE_DIR, "competency_model.joblib")

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


def extract_task_evidence(db, learner_id, task_id):
    submissions = list(
        db.codeexecutions.find(
            {
                "learnerId": learner_id,
                "taskId": task_id,
                "assessmentMode": "AI_ASSISTED",
                "runType": "SUBMISSION",
            }
        ).sort("occurredAt", 1)
    )

    if not submissions:
        return None

    interactions = list(
        db.aiinteractions.find(
            {"learnerId": learner_id, "taskId": task_id}
        )
    )

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

    code_lengths = [
        len(item.get("code", ""))
        for item in submissions
    ]

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


def predict(learner_id):
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            "competency_model.joblib is missing. Train the model before requesting competency."
        )

    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]
    feature_columns = artifact["feature_columns"]

    db = get_database()

    task_ids = db.codeexecutions.distinct(
        "taskId",
        {
            "learnerId": learner_id,
            "assessmentMode": "AI_ASSISTED",
            "runType": "SUBMISSION",
        },
    )

    task_predictions = []

    for task_id in task_ids:
        evidence = extract_task_evidence(db, learner_id, task_id)
        if not evidence:
            continue

        row = {column: evidence.get(column, 0.0) for column in feature_columns}

        # target_no_ai_score is deliberately excluded from prediction inputs.
        row.pop("target_no_ai_score", None)

        import pandas as pd
        frame = pd.DataFrame([row], columns=feature_columns)
        prediction = float(model.predict(frame)[0])
        prediction = max(0.0, min(100.0, prediction))

        task_predictions.append(
            {
                "taskId": str(task_id),
                "score": round(prediction, 2),
            }
        )

    if not task_predictions:
        return {
            "score": None,
            "level": "Not enough data",
            "tasksEvaluated": 0,
            "taskPredictions": [],
        }

    overall_score = mean(item["score"] for item in task_predictions)

    if overall_score < 40:
        level = "Needs Improvement"
    elif overall_score < 70:
        level = "Developing"
    else:
        level = "Proficient"

    return {
        "score": round(overall_score, 2),
        "level": level,
        "tasksEvaluated": len(task_predictions),
        "taskPredictions": task_predictions,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "learnerId is required"}))
        sys.exit(1)

    learner_id = sys.argv[1]

    try:
        result = predict(learner_id)
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({"error": str(error)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
