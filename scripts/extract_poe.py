import os
import glob
import base64
import json
import time
from openai import OpenAI

client = OpenAI(
    api_key="C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg",
    base_url="https://api.poe.com/v1",
)

MODEL = "Gemini-3-Flash"

def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

PROMPT = """Extract the Cantonese glossary entries from this image. 
Return the output EXACTLY as a JSON array of objects. Do not include markdown formatting like ```json or anything else.
The image contains a two-column table. Extract all entries from BOTH columns. Read from left to right, top to bottom.
Each object should have the following keys:
- "jyutping": The Jyutping pronunciation and the Cantonese characters (e.g., "āa1 鴉", "āa1 吖", "bāai1 bāai3 拜拜"). Use the whole Jyutping + Character string as it appears on the left side, before the part of speech.
- "part_of_speech": The part of speech in parentheses (e.g., "(N)", "(Part)", "(SE)", "(VO)").
- "english": The English meaning (e.g., "crow", "bye-bye"). If there are multiple lines of translation, combine them into one string.
- "lesson": The lesson or unit number on the far right column (e.g., "U.1", "L.6", "*").

Example output format:
[
  {
    "jyutping": "āa1 鴉",
    "part_of_speech": "(N)",
    "english": "crow",
    "lesson": "U.1"
  },
  {
    "jyutping": "Dīng1 定",
    "part_of_speech": "(Conj) or",
    "english": "only used in a question indicating options",
    "lesson": "L.11"
  }
]
"""

def extract_page(image_path):
    base64_image = encode_image(image_path)
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    }
                ]
            }],
            temperature=0.0
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error extracting {image_path}: {e}")
        return None

def main():
    base_dir = "/Users/prityushjhaveri/Projects/Year 4/cantonese"
    image_dir = os.path.join(base_dir, "pdf_images")
    output_file = os.path.join(base_dir, "data", "glossary.json")
    
    # Check if we already have some data extracted to resume from
    all_data = []
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                content = f.read()
                if content.strip():
                    all_data = json.loads(content)
                print(f"Loaded {len(all_data)} existing entries from {output_file}.")
        except Exception as e:
            print(f"Failed to load existing data: {e}. Starting fresh.")
    
    # We want to process pages 222 to 270
    # For idempotency, maybe we can just process all of them and overwrite 
    # but the user requested reading 5 pages at a time or just doing it all consistently
    all_pages = []
    for p in range(222, 271):
        path = os.path.join(image_dir, f"page_{p}.png")
        if os.path.exists(path):
            all_pages.append(path)
            
    print(f"Found {len(all_pages)} pages to process.")
    
    for idx, image_path in enumerate(all_pages):
        print(f"Processing {os.path.basename(image_path)} ({idx+1}/{len(all_pages)})...")
        result = extract_page(image_path)
        if result:
            try:
                # Clean up potential markdown formatting
                cleaned_result = result.strip()
                if cleaned_result.startswith("```json"):
                    cleaned_result = cleaned_result[7:]
                elif cleaned_result.startswith("```"):
                    cleaned_result = cleaned_result[3:]
                if cleaned_result.endswith("```"):
                    cleaned_result = cleaned_result[:-3]
                    
                data = json.loads(cleaned_result.strip())
                all_data.extend(data)
                print(f"  Successfully extracted {len(data)} entries.")
                
                # Save incrementally after each page
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(all_data, f, ensure_ascii=False, indent=2)
                    
            except json.JSONDecodeError as e:
                print(f"  Failed to parse JSON for {image_path}: {e}")
                print(f"  Raw output: {result[:200]}...")
                
        # Removed sleep as per user request
        
    print(f"Done! Extracted a total of {len(all_data)} entries to {output_file}")

if __name__ == "__main__":
    main()
