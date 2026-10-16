import os
import sys

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "competency_model.joblib")
ENV_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", ".env"))

load_dotenv(ENV_PATH)

MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME") or os.getenv("MONGODB_DB") or os.getenv("MONGO_DB_NAME")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI or MONGODB_URI is missing from backend/.env")


def get_database(client):
    if DB_NAME:
        return client[DB_NAME]
    default_db = client.get_default_database()
    if default_db is not None:
        return default_db
    raise RuntimeError(
        "DB_NAME/MONGODB_DB is missing and the MongoDB URI does not contain a default database."
    )


def safe_mean(values):
    values = [float(value) for value in values if value is not None]
    return float(np.mean(values)) if values else 0.0


def safe_std(values):
    values = [float(value) for value in values if value is not None]
    return float(np.std(values)) if values else 0.0


def extract_ai_evidence(db, learner_id, task_id):
    """Extract only AI-assisted evidence. The NO-AI target is never used."""
    codeexecutions = db["codeexecutions"]
    aiinteractions = db["aiinteractions"]

    submissions = list(
        codeexecutions.find(
            {
                "learnerId": learner_id,
                "taskId": task_id,
                "assessmentMode": "AI_ASSISTED",
                "runType": "SUBMISSION",
            }
        ).sort("occurredAt", 1)
    )

    interactions = list(
        aiinteractions.find({"learnerId": learner_id, "taskId": task_id})
    )

    if not submissions:
        raise RuntimeError(
            f"No AI-assisted submissions found for learner={learner_id}, task={task_id}."
        )

    correctness = [
        float(item["correctnessScore"])
        for item in submissions
        if item.get("correctnessScore") is not None
    ]
    if not correctness:
        raise RuntimeError("AI-assisted submissions were found, but none has a correctnessScore.")

    code_lengths = [len(item.get("code") or "") for item in submissions]
    execution_times = [
        float(item["executionTimeMs"])
        for item in submissions
        if item.get("executionTimeMs") is not None
    ]
    assistance_types = [item.get("assistanceType") for item in interactions]

    return {
        "ai_submission_count": len(submissions),
        "ai_first_correctness": correctness[0],
        "ai_mean_correctness": safe_mean(correctness),
        "ai_best_correctness": max(correctness),
        "ai_final_correctness": correctness[-1],
        "ai_correctness_improvement": correctness[-1] - correctness[0],
        "ai_correctness_std": safe_std(correctness),
        "ai_runtime_error_count": sum(
            1 for item in submissions if item.get("executionStatus") == "ERROR"
        ),
        "ai_mean_code_length": safe_mean(code_lengths),
        "ai_mean_execution_time_ms": safe_mean(execution_times),
        "ai_interaction_count": len(interactions),
        "hint_count": assistance_types.count("HINT"),
        "debugging_count": assistance_types.count("DEBUGGING"),
        "code_generation_count": assistance_types.count("DIRECT_CODE_GENERATION"),
        "direct_solution_count": assistance_types.count("DIRECT_SOLUTION"),
        "conceptual_explanation_count": assistance_types.count("CONCEPTUAL_EXPLANATION"),
    }


def predict(evidence):
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(
            f"Trained model not found: {MODEL_PATH}\nRun train_model.py first."
        )

    artifact = joblib.load(MODEL_PATH)
    model = artifact["model"]
    feature_columns = artifact["feature_columns"]

    row = {feature: evidence.get(feature, 0.0) for feature in feature_columns}
    row.pop("target_no_ai_score", None)
    frame = pd.DataFrame([row], columns=[c for c in feature_columns if c != "target_no_ai_score"])

    prediction = float(model.predict(frame)[0])
    prediction = float(np.clip(prediction, 0, 100))

    if prediction < 40:
        level = "Needs Improvement"
    elif prediction < 70:
        level = "Developing"
    else:
        level = "Proficient"

    return prediction, level


def main():
    if len(sys.argv) != 3:
        print(
            "Usage:\n"
            "  python predict_competency.py <learner_id> <task_id>\n\n"
            "Example:\n"
            "  python predict_competency.py <learner_id> <task_id>"
        )
        sys.exit(1)

    learner_id = sys.argv[1]
    task_id = sys.argv[2]
    client = MongoClient(MONGO_URI)

    try:
        db = get_database(client)
        evidence = extract_ai_evidence(db, learner_id, task_id)
        prediction, level = predict(evidence)

        print("\nReal AI-assisted evidence")
        print("--------------------------------")
        for key, value in evidence.items():
            print(f"{key}: {value}")

        print("\nPrediction")
        print("--------------------------------")
        print(f"Predicted NO-AI competency score: {prediction:.2f}/100")
        print(f"Estimated competency level: {level}")
        print("\nNote: target_no_ai_score was NOT used as an input feature.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
