import PyPDF2
import sys

def read_pdf(file_path):
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for i, page in enumerate(reader.pages):
                text += f"\n--- Page {i+1} ---\n"
                text += page.extract_text()
            print(text.strip())
    except Exception as e:
        print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        read_pdf(sys.argv[1])
    else:
        print("Please provide a path to a PDF file")
