import numpy as np

def evaluate_regression(y_true, y_pred):
    if y_pred is None:
        return "NOT_EVALUATED"
    return {"MAE": np.mean(np.abs(y_true - y_pred))}

def evaluate_classification(y_true, y_pred):
    if y_pred is None:
        return "NOT_EVALUATED"
    return {"balanced_accuracy": 0.0}
