import os
import subprocess
import sys

TARGET_DIR = r"D:\DATA\[SUBTITLER]"

def download_subtitles():
    if not os.path.exists(TARGET_DIR):
        print(f"[X] Directory does not exist: {TARGET_DIR}")
        return

    print(f"=== Downloading Subtitles (EN & ID) for: {TARGET_DIR} ===")
    
    # Construct subliminal command
    cmd = [
        sys.executable, "-m", "subliminal", 
        "download", 
        "-l", "en", 
        "-l", "id", 
        TARGET_DIR
    ]

    try:
        subprocess.run(cmd, check=True)
        print("\n[✓] Subtitle download process finished.")
    except subprocess.CalledProcessError as e:
        print(f"\n[X] Subliminal encountered an error: {e}")

if __name__ == "__main__":
    download_subtitles()