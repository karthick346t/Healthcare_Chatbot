import easyocr
import sys
import os

# Initialize the reader (English language)
# Setting gpu=True will use GPU if available, else CPU
reader = easyocr.Reader(['en'], gpu=False) 

def extract_text(image_path):
    if not os.path.exists(image_path):
        print(f"Error: File {image_path} not found.")
        return

    try:
        # readtext returns a list of tuples: (bounding box, text, confidence)
        # detail=0 returns only the text strings
        results = reader.readtext(image_path, detail=0)
        
        # Combine text with spaces
        full_text = " ".join(results)
        print(full_text)
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python easy_ocr.py <path_to_image>")
    else:
        extract_text(sys.argv[1])
