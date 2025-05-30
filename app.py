from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from utils.scraper import scrape_url
from utils.pdf_reader import extract_text_from_pdf
from utils.summarizer import summarize_text
from utils.qa_model import create_vectorstore, get_answer
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

global_content = {
    "text": "",
    "vectorstore": None
}

# Serve the frontend
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze_url", methods=["POST"])
def analyze_url():
    url = request.json.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400

    text = scrape_url(url)
    summary = summarize_text(text)

    global_content["text"] = text
    global_content["vectorstore"] = create_vectorstore(text)

    return jsonify({"summary": summary})

@app.route("/analyze_pdf", methods=["POST"])
def analyze_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No PDF uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)
    summary = summarize_text(text)

    global_content["text"] = text
    global_content["vectorstore"] = create_vectorstore(text)

    return jsonify({"summary": summary})

@app.route("/ask", methods=["POST"])
def ask_question():
    question = request.json.get("question")
    if not question or not global_content["vectorstore"]:
        return jsonify({"answer": "Please analyze content first."}), 400

    answer = get_answer(question, global_content["vectorstore"])
    return jsonify({"answer": answer})

if __name__ == "__main__":
    app.run(debug=True)
