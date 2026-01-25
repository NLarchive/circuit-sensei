import json
import os

def find_vague_and_empty():
    manifest_path = 'story/levels-manifest.json'
    if not os.path.exists(manifest_path):
        print(f"File not found: {manifest_path}")
        return

    with open(manifest_path, 'r', encoding='utf-8') as f:
        raw_content = f.read()
    
    vague_phrases = ["Build complex logic", "Complete the circuit"]
    for phrase in vague_phrases:
        if phrase.lower() in raw_content.lower():
            print(f"FOUND PHRASE: '{phrase}'")
        else:
            print(f"NOT FOUND: '{phrase}'")

    data = json.loads(raw_content)
    results = []

    def check_recursive(obj, context):
        if isinstance(obj, dict):
            # Check for empty objective
            if 'objective' in obj:
                v = obj['objective']
                if not v or v == "":
                    results.append({
                        'context': f"{context} [EMPTY OBJECTIVE]",
                        'value': v
                    })
                # Check for vague phrases in objective specifically
                if isinstance(v, str):
                    for phrase in vague_phrases:
                        if phrase.lower() in v.lower():
                            results.append({
                                'context': f"{context} [VAGUE OBJECTIVE]",
                                'value': v
                            })
            
            for k, v in obj.items():
                if k != 'objective': # already checked
                    check_recursive(v, f"{context} > {k}")
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                check_recursive(item, f"{context}[{i}]")

    for i, level in enumerate(data.get('levels', [])):
        level_id = level.get('id', f"index_{i}")
        check_recursive(level, f"Level: {level_id}")

    for result in results:
        print(f"{result['context']} | Found: '{result['value']}'")

if __name__ == "__main__":
    find_vague_and_empty()
