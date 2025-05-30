import PyPDF2
import logging

try:
    import fitz  # PyMuPDF for OCR fallback
except ImportError:
    fitz = None

def extract_text_from_pdf(filepath):
    """
    Extracts text from a PDF file. Falls back to OCR for scanned PDFs if PyMuPDF is installed.
    Returns the extracted text as a string.
    """
    try:
        text = ""
        with open(filepath, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        if text.strip():
            return text.strip()

        # Fallback to OCR with PyMuPDF (if available) for scanned PDFs
        if fitz is not None:
            doc = fitz.open(filepath)
            ocr_text = []
            for page in doc:
                ocr_text.append(page.get_text("text"))
            return "\n".join(ocr_text).strip()
        else:
            logging.warning("PyMuPDF not installed; OCR fallback is unavailable.")

        raise ValueError("No text could be extracted from PDF (consider installing PyMuPDF for OCR).")
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {e}")
        raise RuntimeError(f"PDF extraction failed: {e}")