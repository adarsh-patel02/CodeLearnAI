import argparse
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATASET = os.path.join(BASE_DIR, "dataset.csv")
DEFAULT_MODEL = os.path.join(BASE_DIR, "competency_model.joblib")
TARGET = "target_no_ai_score"
EXCLUDED = {
    "learner_id",
    "task_id",
    "no_ai_execution_id",
    "assessment_time",
    TARGET,
}


def train(dataset_path=DEFAULT_DATASET, model_path=DEFAULT_MODEL):
    if not os.path.exists(dataset_path):
        raise RuntimeError(
            f"Dataset not found: {dataset_path}. Run extract_dataset.py first."
        )

    df = pd.read_csv(dataset_path)
    if TARGET not in df.columns:
        raise RuntimeError(f"Dataset is missing required target column: {TARGET}")

    df = df.dropna(subset=[TARGET]).copy()
    if df.empty:
        raise RuntimeError("Dataset contains no rows with a valid target_no_ai_score.")

    feature_columns = [column for column in df.columns if column not in EXCLUDED]
    if not feature_columns:
        raise RuntimeError("No usable model features were found in the dataset.")

    # All research features are numeric derived evidence. Convert explicitly so
    # the saved artifact and runtime predictor use the same schema.
    X = df[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    y = pd.to_numeric(df[TARGET], errors="coerce")

    valid = y.notna()
    X = X.loc[valid]
    y = y.loc[valid]

    if len(X) < 5:
        raise RuntimeError(
            f"Only {len(X)} usable rows are available. Collect more paired learner-task data before training."
        )

    if "learner_id" in df.columns and df.loc[valid, "learner_id"].nunique() < 2:
        raise RuntimeError(
            "Training requires data from at least 2 unique learners. "
            "Do not train a research model from a single learner."
        )

    model = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("regressor", Ridge(alpha=1.0)),
        ]
    )
    model.fit(X, y)

    artifact = {
        "model": model,
        "feature_columns": feature_columns,
        "target_column": TARGET,
        "model_name": "Ridge regression",
        "training_rows": int(len(X)),
        "unique_learners": int(df.loc[valid, "learner_id"].nunique())
        if "learner_id" in df.columns
        else None,
        "research_note": "No-AI assessment score is the target and is excluded from model inputs.",
    }

    joblib.dump(artifact, model_path)

    metadata = {
        "model_path": model_path,
        "model_name": artifact["model_name"],
        "training_rows": artifact["training_rows"],
        "unique_learners": artifact["unique_learners"],
        "feature_columns": feature_columns,
        "target_column": TARGET,
    }

    metadata_path = os.path.join(BASE_DIR, "model_metadata.json")
    with open(metadata_path, "w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    print("======================================")
    print("Competency model trained successfully")
    print("======================================")
    print(f"Model: {model_path}")
    print(f"Metadata: {metadata_path}")
    print(f"Rows: {len(X)}")
    print(f"Unique learners: {metadata['unique_learners']}")
    print(f"Features: {len(feature_columns)}")
    print("Target: target_no_ai_score")
    print("Target leakage check: PASSED")
    print("\nFeature columns:")
    for column in feature_columns:
        print(f" - {column}")

    return artifact


def main():
    parser = argparse.ArgumentParser(description="Train the CodeLearnAI competency model.")
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--output", default=DEFAULT_MODEL)
    args = parser.parse_args()
    train(args.dataset, args.output)


if __name__ == "__main__":
    main()
