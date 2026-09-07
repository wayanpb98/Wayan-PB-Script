import os
import re

# Path to the folder containing your video files
folder_path = "D:\Desktop"

# Define a regex pattern to match the filenames and extract [n] value
pattern = r"_"

# Load the new names from a text file, removing BOM if present
with open("renamer.txt", "r", encoding="utf-8-sig") as file:
    new_names = [line.strip() for line in file.readlines()]
    
# Get video files matching the pattern
video_files = [f for f in os.listdir(folder_path) if re.match(pattern, f)]

# Extract [n] and sort
video_files_sorted = sorted(
    video_files,
    key=lambda x: int(re.search(r"\[(\d+)\]", x).group(1)) if re.search(r"\[(\d+)\]", x) else 0  # Default to 0 if missing
)

print(video_files_sorted)

# Check if the number of files matches the number of new names

if len(video_files) != len(new_names):
    print("Error: The number of video files and new names doesn't match!")
else:
    # Rename the files
    for index, video_file in enumerate(video_files):
        old_path = os.path.join(folder_path, video_file)
        new_name = f"{new_names[index]}.mp4"  # Add the file extension
        new_path = os.path.join(folder_path, new_name)

        os.rename(old_path, new_path)
        print(f"Renamed '{video_file}' to '{new_name}'")

print("Renaming completed!")
