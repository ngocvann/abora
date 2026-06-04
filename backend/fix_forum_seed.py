import random
import re

with open("D:/abora/seed_forum.sql", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('('):
        line = re.sub(r'^\(\d+,', lambda m: f"({random.randint(4, 13)},", line)
    new_lines.append(line)

with open("D:/abora/seed_forum.sql", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
