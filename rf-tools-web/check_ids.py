import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract all IDs from HTML
html_ids = set()
for m in re.finditer(r'id=["\'](.*?)["\']', html):
    html_ids.add(m.group(1))

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Extract all $('id') from JS
js_ids = set()
for m in re.finditer(r'\$\(["\'](.*?)["\']\)', js):
    js_ids.add(m.group(1))

missing = js_ids - html_ids
if missing:
    print("FATAL ERROR: IDs in JS but missing in HTML:")
    for i in missing:
        print(" -> " + i)
else:
    print("All IDs used in JS are present in HTML.")
