import subprocess
import sys

# Path to Python 3.12 executable
PYTHON312_PATH = r"C:\Users\appabend\AppData\Local\Programs\Python\Python312\python.exe"

def install(package):
    subprocess.check_call([PYTHON312_PATH, "-m", "pip", "install"] + package.split())
    
# === Core image and system libraries ===
install("Pillow")
install("opencv-python")
install("numpy")
install("scipy")

# === Torch with CUDA support (for RTX 3060 Mobile) ===
install("torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118")

# === Real-ESRGAN and dependencies ===
install("realesrgan")
install("facexlib")
install("gfpgan")

# === Optional: tqdm for progress bars, PySimpleGUI for GUI wrappers ===
install("tqdm")
install("PySimpleGUI")

print("\n✅ All dependencies installed. You're ready to upscale!")
