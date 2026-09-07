import os
import sys
import shutil
import subprocess

TARGET_DIR = r"D:\DATA\[SUBTITLER]"
VIDEO_EXTENSIONS = ('.mkv', '.mp4', '.avi', '.mov', '.m4v', '.webm')

def get_ffsubsync_executable():
    """Finds ffsubsync via system PATH or Python's Scripts directory."""
    # 1. Try standard system PATH
    executable = shutil.which("ffsubsync")
    if executable:
        return executable

    # 2. Look inside the Scripts folder relative to current Python executable
    python_dir = os.path.dirname(sys.executable)
    possible_paths = [
        os.path.join(python_dir, "Scripts", "ffsubsync.exe"),
        os.path.join(python_dir, "ffsubsync.exe"),
        os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "Python", f"Python{sys.version_info.major}{sys.version_info.minor}", "Scripts", "ffsubsync.exe")
    ]

    for path in possible_paths:
        if os.path.exists(path):
            return path

    return None

def sync_subtitles():
    if not os.path.exists(TARGET_DIR):
        print(f"[X] Target directory not found: {TARGET_DIR}")
        return

    ffsubsync_bin = get_ffsubsync_executable()
    if not ffsubsync_bin:
        print("[X] Error: 'ffsubsync' executable could not be found.")
        print("    Please ensure ffsubsync is installed in your Python environment.")
        return

    print(f"[✓] Using executable: {ffsubsync_bin}")
    print(f"=== Scanning for videos to sync in: {TARGET_DIR} ===")
    
    video_files = []
    for root, _, files in os.walk(TARGET_DIR):
        for file in files:
            if file.lower().endswith(VIDEO_EXTENSIONS):
                video_files.append(os.path.join(root, file))

    if not video_files:
        print("[!] No matching video files found.")
        return

    print(f"[✓] Found {len(video_files)} video file(s). Starting synchronization...\n")

    for index, video_path in enumerate(video_files, start=1):
        filename = os.path.basename(video_path)
        print(f"[{index}/{len(video_files)}] Syncing: {filename}")
        
        cmd = [
            ffsubsync_bin,
            video_path,
            "--overwrite-input"
        ]

        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"    [X] Failed to sync {filename}: {e}")
        except Exception as ex:
            print(f"    [X] Unexpected error on {filename}: {ex}")

    print("\n[✓] Bulk synchronization finished.")

if __name__ == "__main__":
    sync_subtitles()