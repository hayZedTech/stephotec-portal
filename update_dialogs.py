import os
import re

directory = r"c:\stephotec-portal\src"

dialog_pattern = re.compile(r'(<Dialog[^>]*onClose={)([^}]+)(}[^>]*>)')

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        prefix = match.group(1)
        handler = match.group(2)
        suffix = match.group(3)
        
        # If it's already an arrow function handling reason
        if "reason ===" in handler or "backdropClick" in handler:
            return match.group(0)
            
        if handler.startswith("() => "):
            body = handler[6:]
            new_handler = f"(e, reason) => {{ if (reason === 'backdropClick') return; {body}; }}"
        else:
            new_handler = f"(e, reason) => {{ if (reason === 'backdropClick') return; {handler}(e, reason); }}"
            
        return prefix + new_handler + suffix

    new_content = dialog_pattern.sub(replacer, content)

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            process_file(os.path.join(root, file))

print("Done")
