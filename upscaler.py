import os
from PIL import Image
import torch
import torchvision.transforms as T

# === Paths ===
INPUT_DIR = "D:\\Desktop"
MODEL_DIR = "D:\\Documents\\appabend DRIVE\\WAIFU2X"
MODELS = {
    "AnimeSharp": "4x-AnimeSharp.pth",
    "BSRGAN": "BSRGAN.pth",
    "RealESRGAN": "RealESRGAN_x4plus.pth"
}

# === Load input image ===
input_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
if not input_files:
    raise FileNotFoundError("No image found in Desktop folder.")
input_path = os.path.join(INPUT_DIR, input_files[0])
img = Image.open(input_path).convert("RGB")
original_name = os.path.splitext(input_files[0])[0]

# === Compute upscale target ===
w, h = img.size
scale = 2160 / min(w, h)
target_size = (int(w * scale), int(h * scale))

# === Dummy upscaler (replace with actual model logic) ===
def dummy_upscale(image, target_size):
    return image.resize(target_size, Image.LANCZOS)

# === Process with each model ===
for label, model_file in MODELS.items():
    model_path = os.path.join(MODEL_DIR, model_file)
    
    # Load your actual model here (this is a placeholder)
    print(f"Using model: {label} from {model_path}")
    
    # Replace dummy_upscale with actual model inference
    upscaled = dummy_upscale(img, target_size)
    
    # Save output
    output_name = f"{original_name}_{label}.png"
    output_path = os.path.join(INPUT_DIR, output_name)
    upscaled.save(output_path)
    print(f"Saved: {output_path}")