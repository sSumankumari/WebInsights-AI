import requests
from bs4 import BeautifulSoup

def scrape_url(url):
    """Extracts the text content from a given URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise error for bad status codes

        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all("p")
        text = "\n".join([p.get_text() for p in paragraphs if p.get_text().strip()])

        return text if text else "No text found."
    except requests.exceptions.RequestException as e:
        return f"Error fetching the URL: {e}"
