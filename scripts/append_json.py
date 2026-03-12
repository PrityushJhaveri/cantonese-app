import json
import os
import sys

def append_to_glossary(new_data):
    file_path = "/Users/prityushjhaveri/Projects/Year 4/cantonese/data/glossary.json"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
    else:
        data = []
        
    data.extend(new_data)
    
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        new_data = json.load(f)
    append_to_glossary(new_data)
    with open("/Users/prityushjhaveri/Projects/Year 4/cantonese/data/glossary.json", "r", encoding="utf-8") as f:
        total = len(json.load(f))
    print(f"Appended {len(new_data)} items. Total items so far: {total}")
