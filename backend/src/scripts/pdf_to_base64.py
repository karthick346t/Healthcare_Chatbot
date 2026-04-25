import fitz
import base64
import sys
import os

def pdf_to_base64(pdf_path):
    try:
        if not os.path.exists(pdf_path):
            print(f"Error: File {pdf_path} not found.")
            return

        # Open the PDF
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            print("Error: PDF is empty.")
            return

        # Render first page to a pixmap (image)
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # 1.5x scale is balanced for speed vs quality
        
        # Convert pixmap to bytes (PNG)
        img_bytes = pix.tobytes("png")
        
        # Base64 encode
        base64_string = base64.b64encode(img_bytes).decode('utf-8')
        
        # Print only the base64 string to stdout
        print(base64_string)
        
        doc.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_base64.py <path_to_pdf>")
    else:
        pdf_to_base64(sys.argv[1])
