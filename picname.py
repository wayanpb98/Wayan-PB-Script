import os
import re

def rename_pictures(directory):
    # File extensions for picture files
    extensions = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp")
    
    # Iterate through all files in the directory (ignore subfolders)
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        
        # Ensure we are dealing with files only, not subfolders
        if os.path.isfile(filepath) and filename.lower().endswith(extensions):
            
            name_without_ext, ext = os.path.splitext(filename)
            
            # --- 1. Fix broken/incorrectly converted Xiaomi files ---
            # Matches patterns like: 2026_07_17_13_33_24_370_org.mozilla.firefox
            broken_pattern = re.match(r'^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{3})_(.*)$', name_without_ext)
            
            # --- 2. Handle raw Xiaomi files directly from the phone ---
            # Matches patterns like: Screenshot_2026-07-17-13-33-24-370_org.mozilla.firefox
            raw_pattern = re.match(r'^Screenshot_(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{3})_(.*)$', name_without_ext)
            
            if broken_pattern:
                p = broken_pattern.groups()
                new_name = f"{p[0]}{p[1]}{p[2]}_{p[3]}{p[4]}{p[5]}{p[6]}_{p[7]}{ext}"
                
            elif raw_pattern:
                p = raw_pattern.groups()
                new_name = f"{p[0]}{p[1]}{p[2]}_{p[3]}{p[4]}{p[5]}{p[6]}_{p[7]}{ext}"
                
            # --- 3. Handle Reddit-downloaded files ---
            # Example: RDT_20260813_021212493273777144407823.jpg -> 20260813_021212493273777144407823.jpg
            elif filename.startswith("RDT_"):
                new_name = filename.replace("RDT_", "")
                
            # --- 4. Handle Legacy Formats (Samsung / Infinix) ---
            else:
                new_name = filename.replace("Screenshot_", "").replace("-", "_")
            
            # Prevent renaming if the name didn't change (or if target already exists)
            if new_name != filename:
                new_filepath = os.path.join(directory, new_name)
                
                try:
                    os.rename(filepath, new_filepath)
                    print(f'Renamed: "{filename}" to "{new_name}"')
                except FileExistsError:
                    print(f'Skipped: "{new_name}" already exists.')

# Specify the directory containing the picture files
directory_path = "D:/Documents/appabend DRIVE/Screenshots"

rename_pictures(directory_path)