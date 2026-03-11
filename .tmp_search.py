import pathlib 
root = pathlib.Path('src') 
patterns = ['emoji','fluent-emoji','twemoji','emojione'] 
for path in root.rglob('*.vue'): 
    text = path.read_text(encoding='utf-8', errors='ignore') 
    if any(p in text for p in patterns): 
        print(path) 
