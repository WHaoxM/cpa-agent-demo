import pathlib 
text = pathlib.Path('src/views/student/Report.vue').read_text(encoding='utf-8', errors='ignore') 
for line in text.splitlines(): 
    if 'icon:' in line: 
        print(line.strip()) 
