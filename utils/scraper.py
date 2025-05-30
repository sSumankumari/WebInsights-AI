import requests
from bs4 import BeautifulSoup

def scrape_url(url):
    try:
        response = requests.get(url, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        return ' '.join([p.get_text() for p in soup.find_all('p')])
    except Exception as e:
        return f"Failed to retrieve content: {e}"
