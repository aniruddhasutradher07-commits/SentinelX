import json
import os

log_file = "/Users/aniruddhasutradhar/.gemini/antigravity-ide/brain/73e59164-adc4-4e8f-b8b4-aa2274fdef50/.system_generated/logs/transcript_full.jsonl"
out_file = "/Users/aniruddhasutradhar/Desktop/SIH/data/odisha_census_khordha_2011.csv"

# Read backwards or just iterate through all lines to find the last USER_INPUT
csv_content = ""
with open(log_file, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                content = data.get("content", "")
                if "State,District,Subdistt" in content:
                    # Extract the CSV part
                    start_idx = content.find("State,District,Subdistt")
                    # Find where the CSV ends (might just be the end of the message)
                    end_idx = content.find("<USER_REQUEST>", start_idx)
                    if end_idx == -1:
                        end_idx = len(content)
                    csv_content = content[start_idx:end_idx].strip()
        except Exception as e:
            pass

if csv_content:
    with open(out_file, "w", encoding="utf-8") as out:
        out.write(csv_content)
    print(f"Successfully wrote CSV to {out_file} with {len(csv_content.splitlines())} lines.")
else:
    print("CSV content not found in logs.")
