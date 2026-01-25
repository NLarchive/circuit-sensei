import json

def list_objectives():
    with open('story/levels-manifest.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for level in data.get('levels', []):
        level_id = level.get('id')
        obj = level.get('objective', 'MISSING')
        print(f"{level_id}: {obj}")
        variants = level.get('variants', {})
        for vname, vdata in variants.items():
            vobj = vdata.get('objective', 'MISSING')
            print(f"  {vname}: {vobj}")

if __name__ == "__main__":
    list_objectives()
