import json
import os
import requests

def reorder_lesson_words():
    base_dir = "/Users/prityushjhaveri/Projects/Year 4/cantonese"
    output_file = os.path.join(base_dir, "cantonese-app", "data", "chapters.json")
    
    with open(output_file, 'r', encoding='utf-8') as f:
        chapters_data = json.load(f)

    # Group by lesson
    lesson_groups = {}
    for word in chapters_data:
        lesson = word['lessonStr']
        if lesson not in lesson_groups:
            lesson_groups[lesson] = []
        lesson_groups[lesson].append(word)

    print(f"Loaded {len(chapters_data)} words across {len(lesson_groups)} lessons.")

    # We will use Poe API to logically group words within each lesson
    # Only if the lesson has more than 3 words to make it worth it
    
    api_key = "C0CZJ6kdNd9fRWaJP1wiMefMGd_Zsge38axkhB1oJvg"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    reordered_data = []

    for lesson, words in lesson_groups.items():
        if len(words) <= 3:
            reordered_data.extend(words)
            continue
            
        print(f"Reordering {lesson} ({len(words)} words)...")
        
        # Prepare lightweight list for LLM to reorder
        word_list = [{"id": w['number'], "eng": w['english'], "pos": w['pos']} for w in words]
        
        prompt = f"""
You are an expert curriculum designer. Please reorder the following list of vocabulary words so that words of similar categories, themes, or grammatical functions appear sequentially together (e.g. all countries together, all food items together, all pronouns together). 

Here is the list:
{json.dumps(word_list, ensure_ascii=False, indent=2)}

Please return ONLY a JSON array containing the exactly identical objects, but in the new, logically grouped order. Do not change the keys or values. Do not use markdown backticks, return raw JSON array only.
"""
        try:
            response = requests.post('https://api.poe.com/v1/chat/completions', headers=headers, json={
                "model": "Gemini-3-Flash",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            })
            
            if response.ok:
                resp_json = response.json()
                content = resp_json['choices'][0]['message']['content'].strip()
                
                if content.startswith('```json'):
                    content = content[7:-3].strip()
                elif content.startswith('```'):
                    content = content[3:-3].strip()
                    
                new_order = json.loads(content)
                
                # Reconstruct full word objects based on the new ID order
                ordered_full_words = []
                for basic_word in new_order:
                    # Find matching word in original list
                    match = next((w for w in words if w['number'] == basic_word['id']), None)
                    if match:
                        ordered_full_words.append(match)
                
                # Handle any that were missed by the LLM
                for w in words:
                    if w not in ordered_full_words:
                        ordered_full_words.append(w)
                        
                reordered_data.extend(ordered_full_words)
            else:
                print(f"Failed to reorder {lesson}, falling back to original. Status: {response.status_code}")
                reordered_data.extend(words)
        except Exception as e:
            print(f"Error reordering {lesson}: {e}")
            reordered_data.extend(words)

    # Re-apply sequential numbering based on the new order
    for idx, word in enumerate(reordered_data):
        word['number'] = idx + 1

    # Save it back
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reordered_data, f, ensure_ascii=False, indent=2)

    print(f"Successfully reordered and saved {len(reordered_data)} words.")

if __name__ == "__main__":
    reorder_lesson_words()
