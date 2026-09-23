import re

def patch_file(path):
    try:
        with open(path, "r") as f:
            content = f.read()

        content = content.replace("from core.thermal_stress import compute_htsi", "from core.thermal_stress import compute_environmental_score")
        content = content.replace("from core.thermal_stress import heat_index_celsius, compute_htsi", "from core.thermal_stress import heat_index_celsius, compute_environmental_score")
        content = re.sub(r"compute_htsi\(", "compute_environmental_score(", content)
        content = content.replace(".htsi_score", ".environmental_score")

        with open(path, "w") as f:
            f.write(content)
        print(f"Patched {path}")
    except Exception as e:
        print(f"Error patching {path}: {e}")

patch_file("routers/mock_api.py")
patch_file("experimental_ml/heatwave_classifier.py")

