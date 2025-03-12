from flask import Flask, render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import nltk
from nltk.tokenize import sent_tokenize

# Download NLTK dependencies
nltk.download('punkt')

app = Flask(__name__)

def fetch_and_summarize(url):
    try:
        # Fetch web page content
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return "Error: Unable to fetch the webpage."

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract text content
        paragraphs = soup.find_all("p")
        text = " ".join([p.get_text() for p in paragraphs])

        if len(text) == 0:
            return "Error: No readable content found."

        # Summarize (get first 3 sentences)
        sentences = sent_tokenize(text)
        summary = " ".join(sentences[:3])  # Return first 3 sentences

        return summary

    except Exception as e:
        return f"Error: {str(e)}"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL provided"}), 400

    summary = fetch_and_summarize(url)
    return jsonify({"summary": summary})

if __name__ == "__main__":
    app.run(debug=True)
