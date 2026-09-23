import re

path = "src/types.ts"
try:
    with open(path, "r") as f:
        content = f.read()

    # Rename HTSI to environmental_score
    content = content.replace("htsi_score", "environmental_score")
    content = content.replace("htsi_tier", "environmental_tier")
    content = content.replace("HTSI", "Environmental Score")

    with open(path, "w") as f:
        f.write(content)
    print("Patched types.ts")
except Exception as e:
    print(f"Skipping types.ts: {e}")

# Try patching WardView.tsx
path = "src/components/WardView.tsx"
try:
    with open(path, "r") as f:
        content = f.read()
    
    content = content.replace("w.htsi_score", "w.environmental_score")
    content = content.replace("w.htsi_tier", "w.environmental_tier")
    content = content.replace("HTSI", "Env Hazard")
    content = content.replace("Heatwave Risk", "Environmental Hazard")
    
    with open(path, "w") as f:
        f.write(content)
    print("Patched WardView.tsx")
except Exception as e:
    print(f"Skipping WardView.tsx: {e}")

