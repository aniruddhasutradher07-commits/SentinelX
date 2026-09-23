with open("routers/thermal.py", "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if i >= 72 and i <= 99:
        if not line.startswith("#") and line.strip() != "":
            line = "# " + line
    new_lines.append(line)

with open("routers/thermal.py", "w") as f:
    f.writelines(new_lines)
print("Patched routers/thermal.py")
