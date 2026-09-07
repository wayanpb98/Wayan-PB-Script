import os
import subprocess
import json

# === CONFIG ===
ffmpeg_path = r"D:\FRAPS\Flowframes\Flowframes\FlowframesData\pkgs\av\ffmpeg.exe"
ffprobe_path = r"D:\FRAPS\Flowframes\Flowframes\FlowframesData\pkgs\av\ffprobe.exe"

desktop = r"D:\Desktop"
renamer_folder = r"D:\Documents\appabend DRIVE\RENAMER"
timestamp_file = os.path.join(renamer_folder, "timestamps.txt")
metadata_file = os.path.join(renamer_folder, "chapters.ffmeta")
renamed_video = os.path.join(desktop, "original.mp4")

# === Step 1: Find .mp4 longer than 3 minutes ===
for file in os.listdir(desktop):
    if file.lower().endswith(".mp4"):
        full_path = os.path.join(desktop, file)
        result = subprocess.run(
            [ffprobe_path, "-v", "error", "-show_entries", "format=duration", "-of", "json", full_path],
            capture_output=True, text=True
        )
        duration = float(json.loads(result.stdout)["format"]["duration"])
        if duration > 180:
            os.rename(full_path, renamed_video)
            break

# === Step 2: Extract title from metadata ===
result = subprocess.run(
    [ffprobe_path, "-v", "quiet", "-print_format", "json", "-show_format", renamed_video],
    capture_output=True, text=True
)
metadata = json.loads(result.stdout)
original_name = os.path.splitext(file)[0]  # Save before renaming
title = metadata.get("format", {}).get("tags", {}).get("title", original_name)

# === Step 3: Parse timestamps.txt ===
with open(timestamp_file, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]

chapters = []
for i in range(len(lines)):
    parts = lines[i].split(maxsplit=1)
    start = parts[0].replace(',', '.')
    label = parts[1] if len(parts) > 1 else f"Chapter {i+1}"

    h, m, s = map(float, start.split(":"))
    start_ms = int((h * 3600 + m * 60 + s) * 1000)

    if i + 1 < len(lines):
        next_start = lines[i + 1].split(maxsplit=1)[0].replace(',', '.')
        h2, m2, s2 = map(float, next_start.split(":"))
        end_ms = int((h2 * 3600 + m2 * 60 + s2) * 1000)
    else:
        end_ms = start_ms + 60000

    chapters.append((start_ms, end_ms, label))

# === Step 4: Write FFmetadata file ===
with open(metadata_file, "w", encoding="utf-8") as f:
    for start, end, label in chapters:
        f.write("[CHAPTER]\n")
        f.write("TIMEBASE=1/1000\n")
        f.write(f"START={start}\n")
        f.write(f"END={end}\n")
        f.write(f"title={label}\n\n")

# === Step 5: Inject chapters ===
output_path = os.path.join(desktop, f"{title}.mp4")
subprocess.run([
    ffmpeg_path,
    "-i", renamed_video,
    "-f", "ffmetadata",
    "-i", metadata_file,
    "-map_metadata", "1",
    "-codec", "copy",
    output_path
])

os.remove(renamed_video)
print(f"✅ Chapters added. Output saved as: {output_path}")
