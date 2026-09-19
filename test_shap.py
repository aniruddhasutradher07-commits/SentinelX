import joblib
import numpy as np
import shap
import warnings
warnings.filterwarnings('ignore')

model = joblib.load('data/stage2_xgboost.joblib')
explainer = shap.TreeExplainer(model)
X = np.array([[0.5, 0.6, 0.4, 0.5, 0.6, 0.7, 10000, 0.8, 3]])
shap_values = explainer.shap_values(X)
print("SHAP Base Value:", explainer.expected_value)
print("SHAP Values:", shap_values)
