import PyPDF2

def extract_text_from_pdf(filepath):
    try:
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ''
            for page in reader.pages:
                text += page.extract_text() or ''
            return text.strip()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ''
