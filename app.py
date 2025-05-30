from flask import Flask, request, jsonify, render_template, session, Response
from flask_cors import CORS
from utils.scraper import scrape_url
from utils.pdf_reader import extract_text_from_pdf
from utils.summarizer import summarize_text
from utils.qa_model import create_vectorstore, get_answer, get_answer_streaming
import os
from werkzeug.utils import secure_filename
import uuid
import logging

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", "a-very-secret-key")
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def get_user_session():
    """
    Uses a session ID to associate state for each user.
    Stores extracted text and vectorstore per user session.
    """
    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())
    if not hasattr(app, "session_store"):
        app.session_store = {}
    sid = session["session_id"]
    if sid not in app.session_store:
        app.session_store[sid] = {"text": "", "vectorstore": None}
    return app.session_store[sid]

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
    """
    Accepts a URL, scrapes and summarizes its content, and stores it for the session.
    Returns a JSON summary or error.
    """
    try:
        url = request.json.get("url")
        if not url:
            return jsonify({"error": "URL is required"}), 400

        # Validate URL format
        if not (url.startswith("http://") or url.startswith("https://")):
            return jsonify({"error": "Invalid URL format. Must start with 'http://' or 'https://'."}), 400

        try:
            text = scrape_url(url)
        except Exception as e:
            # This handles errors like 404, connection errors, etc.
            app.logger.error(f"Error scraping URL {url}: {e}")
            return jsonify({"error": f"Failed to retrieve content: {str(e)}"}), 404

        if not text or len(text.split()) < 20:
            return jsonify({"error": "No readable content found at the provided URL."}), 422

        try:
            summary = summarize_text(text)
        except Exception as e:
            app.logger.error(f"Error summarizing content from {url}: {e}")
            return jsonify({"error": f"Failed to summarize content: {str(e)}"}), 500

        user_sess = get_user_session()
        user_sess["text"] = text
        try:
            user_sess["vectorstore"] = create_vectorstore(text)
        except Exception as e:
            app.logger.error(f"Error creating vectorstore for {url}: {e}")
            # Still return summary, but warn about vectorstore
            return jsonify({"summary": summary, "warning": "Summary generated, but Q&A may be unavailable."}), 200

        return jsonify({"summary": summary}), 200
    except Exception as e:
        logging.error(f"Error in /analyze_url: {e}")
        return jsonify({"error": "An unexpected error occurred while analyzing the URL."}), 500

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    """
    Accepts a PDF file, extracts and summarizes its content, and stores it for the session.
    Returns a JSON summary or error.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No PDF uploaded"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        text = extract_text_from_pdf(filepath)
        if not text or len(text.split()) < 20:
            return jsonify({"error": "No readable content found in the uploaded PDF."}), 422

        try:
            summary = summarize_text(text)
        except Exception as e:
            app.logger.error(f"Error summarizing PDF {file.filename}: {e}")
            return jsonify({"error": f"Failed to summarize PDF: {str(e)}"}), 500

        user_sess = get_user_session()
        user_sess["text"] = text
        try:
            user_sess["vectorstore"] = create_vectorstore(text)
        except Exception as e:
            app.logger.error(f"Error creating vectorstore for PDF {file.filename}: {e}")
            return jsonify({"summary": summary, "warning": "Summary generated, but Q&A may be unavailable."}), 200

        return jsonify({"summary": summary}), 200
    except Exception as e:
        logging.error(f"Error in /analyze_pdf: {e}")
        return jsonify({"error": "An unexpected error occurred while analyzing the PDF."}), 500

@app.route("/ask", methods=["POST"])
def ask_question():
    """
    Accepts a question and streams the answer in real time using Server-Sent Events (SSE).
    The answer is generated from the stored vectorstore for the session.
    """
    try:
        question = request.json.get("question")
        user_sess = get_user_session()
        if not question:
            return jsonify({"answer": "Please provide a question."}), 400
        if not user_sess["vectorstore"]:
            return jsonify({"answer": "Please analyze content first."}), 400

        def generate():
            try:
                for chunk in get_answer_streaming(question, user_sess["vectorstore"], k=3):
                    yield f"data: {chunk}\n\n"
            except Exception as e:
                yield f"data: [Error] {str(e)}\n\n"

        return Response(generate(), mimetype="text/event-stream")
    except Exception as e:
        logging.error(f"Error in /ask: {e}")
        return jsonify({"answer": f"Error: {e}"}), 500

@app.route("/ask-once", methods=["POST"])
def ask_once():
    """
    For clients that do not support streaming, this endpoint provides the full answer at once.
    """
    try:
        question = request.json.get("question")
        user_sess = get_user_session()
        if not question:
            return jsonify({"answer": "Please provide a question."}), 400
        if not user_sess["vectorstore"]:
            return jsonify({"answer": "Please analyze content first."}), 400

        try:
            answer = get_answer(question, user_sess["vectorstore"], k=3)
        except Exception as e:
            app.logger.error(f"Error generating answer: {e}")
            return jsonify({"answer": f"Error: {e}"}), 500

        return jsonify({"answer": answer}), 200
    except Exception as e:
        logging.error(f"Error in /ask-once: {e}")
        return jsonify({"answer": f"Error: {e}"}), 500

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, threaded=True)