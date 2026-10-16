import argparse
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATASET = os.path.join(BASE_DIR, "dataset.csv")
DEFAULT_OUTPUT = os.path.join(BASE_DIR, "model_comparison.csv")
TARGET = "target_no_ai_score"
EXCLUDED = {
    "learner_id",
    "task_id",
    "no_ai_execution_id",
    "assessment_time",
    TARGET,
}


def build_models():
    return {
        "Ridge": Pipeline(
            steps=[
                ("scaler", StandardScaler()),
                ("model", Ridge(alpha=1.0)),
            ]
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=300,
            random_state=42,
            min_samples_leaf=2,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=150,
            learning_rate=0.05,
            max_depth=2,
            random_state=42,
        ),
    }


def compare(dataset_path=DEFAULT_DATASET, output_path=DEFAULT_OUTPUT):
    if not os.path.exists(dataset_path):
        raise RuntimeError(f"Dataset not found: {dataset_path}")

    df = pd.read_csv(dataset_path).dropna(subset=[TARGET]).copy()
    if "learner_id" not in df.columns:
        raise RuntimeError("learner_id is required for learner-level evaluation.")

    feature_columns = [column for column in df.columns if column not in EXCLUDED]
    X = df[feature_columns].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    y = pd.to_numeric(df[TARGET], errors="coerce")
    valid = y.notna()
    X = X.loc[valid]
    y = y.loc[valid]
    groups = df.loc[valid, "learner_id"].astype(str)

    if groups.nunique() < 2:
        raise RuntimeError("At least 2 unique learners are required for learner-level comparison.")

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups=groups))

    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]
    y_train = y.iloc[train_idx]
    y_test = y.iloc[test_idx]

    results = []
    for name, model in build_models().items():
        model.fit(X_train, y_train)
        predictions = np.clip(model.predict(X_test), 0, 100)

        results.append(
            {
                "model": name,
                "mae": mean_absolute_error(y_test, predictions),
                "rmse": mean_squared_error(y_test, predictions) ** 0.5,
                "r2": r2_score(y_test, predictions) if len(y_test) >= 2 else np.nan,
                "train_rows": len(X_train),
                "test_rows": len(X_test),
                "train_learners": groups.iloc[train_idx].nunique(),
                "test_learners": groups.iloc[test_idx].nunique(),
            }
        )

    result_df = pd.DataFrame(results).sort_values("mae")
    result_df.to_csv(output_path, index=False)

    print("======================================")
    print("Model comparison completed")
    print("======================================")
    print(result_df.to_string(index=False))
    print(f"\nResults: {output_path}")
    print("Split: learner-level GroupShuffleSplit")
    print("Excluded from X: learner_id, task_id, target_no_ai_score and assessment metadata")

    return result_df


def main():
    parser = argparse.ArgumentParser(description="Compare competency regression models.")
    parser.add_argument("--dataset", default=DEFAULT_DATASET)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    compare(args.dataset, args.output)


if __name__ == "__main__":
    main()
