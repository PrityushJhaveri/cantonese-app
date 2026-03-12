import json
import re
import os
import unicodedata

def normalize_jyutping(text):
    """Strip diacritics from Jyutping, keeping only plain ASCII letters and tone numbers.
    e.g. 'ǎa3' → 'aa3', 'sōeng6' → 'soeng6', 'Měi5' → 'Mei5'
    """
    # Decompose unicode characters then remove combining marks (accents/diacritics)
    nfkd = unicodedata.normalize('NFKD', text)
    stripped = ''.join(c for c in nfkd if not unicodedata.combining(c))
    # Handle special chars that NFKD doesn't decompose well (e.g. ü → u)
    stripped = stripped.replace('ü', 'u')
    return stripped

def format_glossary():
    base_dir = "/Users/prityushjhaveri/Projects/Year 4/cantonese"
    input_file = os.path.join(base_dir, "data", "glossary.json")
    output_file = os.path.join(base_dir, "cantonese-app", "data", "chapters.json")
    
    if not os.path.exists(input_file):
        print(f"Waiting for {input_file} to be created...")
        return
        
    with open(input_file, 'r', encoding='utf-8') as f:
        try:
            raw_data = json.load(f)
        except json.JSONDecodeError:
            print("Current glossary.json is invalid or incomplete. Will retry later.")
            return

    formatted_data = []
    
    for idx, item in enumerate(raw_data):
        # 1. Parse Lesson/Unit Mapping
        unit_str = str(item.get('lesson', '')).strip()
        unit_num = 0
        lesson_str = ""
        
        if unit_str == '*':
            unit_num = 6 # Map Extra Knowledge to Unit 6
            lesson_str = "Extra Knowledge"
        elif "U." in unit_str:
            matches = re.findall(r'\d+', unit_str)
            if matches:
                 unit_num = int(matches[0])
                 lesson_str = f"Unit {unit_num} Intro/Vocab"
        elif "L." in unit_str:
            matches = re.findall(r'\d+', unit_str)
            if matches:
                 lesson_num = int(matches[0])
                 lesson_str = f"Lesson {lesson_num}"
                 # Mapping lessons to units according to the textbook syllabus
                 if 1 <= lesson_num <= 4:
                     unit_num = 3
                 elif 5 <= lesson_num <= 8:
                     unit_num = 4
                 elif 9 <= lesson_num <= 15:
                     unit_num = 5
                 elif lesson_num > 15:
                     unit_num = 0
        else:
             lesson_str = unit_str
        
        # 2. Parse Jyutping and Cantonese Characters
        raw_jp_char = item.get('jyutping', '').strip()
        jyutping = ""
        cantonese = ""
        
        parts = raw_jp_char.split(' ')
        jp_parts = []
        char_parts = []
        
        for part in parts:
            if re.search(r'[a-zA-Z]', part):
                jp_parts.append(part)
            else:
                char_parts.append(part)
                
        if not char_parts:
             match = re.search(r'^([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü0-9\s]+)(.*)$', raw_jp_char)
             if match:
                 jyutping = match.group(1).strip()
                 cantonese = match.group(2).strip()
             else:
                 jyutping = raw_jp_char
                 cantonese = raw_jp_char
        else:
             jyutping = ' '.join(jp_parts)
             cantonese = ' '.join(char_parts)

        # 3. Clean POS
        pos = item.get('part_of_speech', '').strip()
        if pos.startswith('(') and pos.endswith(')'):
            pos = pos[1:-1]
        elif pos.startswith('('):
            pos = pos[1:]
            
        formatted_item = {
            "unit": unit_num,
            "lessonStr": lesson_str,
            "number": idx + 1, 
            "jyutping": normalize_jyutping(jyutping),
            "cantonese": cantonese,
            "pos": pos,
            "english": item.get('english', '').strip(),
            "notes": ""
        }
        formatted_data.append(formatted_item)

    # Sort primarily by unit, then by lesson string, then by number
    formatted_data.sort(key=lambda x: (x['unit'], x['lessonStr'], x['number']))

    # Write to the app's data directory
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(formatted_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully formatted {len(formatted_data)} items and saved to {output_file}")

if __name__ == "__main__":
    format_glossary()
