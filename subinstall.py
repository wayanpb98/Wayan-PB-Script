import subprocess
import sys
import shutil

REQUIRED_PACKAGES = ["subliminal", "ffsubsync"]

def check_and_install_packages():
    print("=== Checking Python Dependencies ===")
    for package in REQUIRED_PACKAGES:
        try:
            __import__(package)
            print(f"[✓] {package} is already installed.")
        except ImportError:
            print(f"[!] {package} is missing. Installing via pip...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"[✓] Successfully installed {package}.")

def check_ffmpeg():
    print("\n=== Checking System Dependencies ===")
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        print(f"[✓] FFmpeg detected at: {ffmpeg_path}")
    else:
        print("[X] WARNING: FFmpeg was NOT found in your system PATH!")
        print("    FFsubsync requires FFmpeg to extract audio tracks.")
        print("    Please install FFmpeg or run 'winget install FFmpeg' in CMD.")

if __name__ == "__main__":
    check_and_install_packages()
    check_ffmpeg()
    print("\n[✓] Environment setup completed.")
    input("\nPress Enter to exit...")