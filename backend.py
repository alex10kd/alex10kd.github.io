import os
import json
from datetime import datetime

# Folder containing txt files
folder_path = "."

# Get all txt files and their last modified dates
files = [
    {"name": f, "date": datetime.fromtimestamp(os.path.getmtime(f)).isoformat()}
    for f in os.listdir(folder_path) if f.endswith("embed.txt")
]

# Sort files by modification date (newest first)
files.sort(key=lambda x: x["date"], reverse=True)

# Save to JSON
with open("file_list.json", "w") as json_file:
    json.dump(files, json_file, indent=4)

print("Updated file_list.json with latest post embeds.")
