import os
import sys
import whisper

# Set your audio directory
AUDIO_DIR = "D:\\WhisperAudio"

# Load Whisper model
model = whisper.load_model("medium", device="cuda")

# Loop through all audio files in the directory
for filename in os.listdir(AUDIO_DIR):
    # Skip temp files and non-audio
    if filename.startswith("~") or not filename.lower().endswith((".mp3", ".wav", ".m4a", ".flac", ".aac")):
        continue

    filepath = os.path.join(AUDIO_DIR, filename)
    print(f"Transcribing: {filepath}")
    try:
        result = model.transcribe(filepath, verbose=True)
        transcript_path = os.path.join(AUDIO_DIR, f"{os.path.splitext(filename)[0]}.txt")
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(result["text"])
        print(f"Saved to: {transcript_path}")
    except Exception as e:
        print(f"Error transcribing {filename}: {e}")

filepath = os.path.join(AUDIO_DIR, filename)

if os.path.exists(filepath):
    print(f"File exists: {filepath}")
else:
    print(f"File NOT found: {filepath}")

print(f"Trying to transcribe: {filepath}")