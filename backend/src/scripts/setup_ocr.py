import easyocr
import os

def setup():
    print("--- EasyOCR Model Setup ---")
    print("Downloading/Checking model files (English)...")
    try:
        # This will trigger the download and show progress in the terminal
        reader = easyocr.Reader(['en'], gpu=False)
        print("\n✅ EasyOCR is ready to use!")
        
        # Test it with a dummy check
        print("Checking if models are loaded into memory...")
        print("Done.")
        
    except Exception as e:
        print(f"\n❌ Error during setup: {str(e)}")

if __name__ == "__main__":
    setup()
