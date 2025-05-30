import requests
from bs4 import BeautifulSoup

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/113.0.0.0 Safari/537.36"
)

def scrape_url(url):
    """
    Fetches and extracts readable text content from the given URL.
    Returns a string containing the main article content, or raises an exception.
    """
    headers = {"User-Agent": DEFAULT_USER_AGENT}
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Try to extract from <article> if present, else fallback to <p>.
        article = soup.find("article")
        if article:
            text = " ".join(p.get_text(separator=" ", strip=True) for p in article.find_all("p"))
        else:
            text = " ".join(p.get_text(separator=" ", strip=True) for p in soup.find_all("p"))

        # Fallback: Extract from <div> with common content classes.
        if not text or len(text.split()) < 20:
            for class_name in ["main-content", "content", "post-content", "entry-content"]:
                div = soup.find("div", class_=class_name)
                if div:
                    text = " ".join(p.get_text(separator=" ", strip=True) for p in div.find_all("p"))
                    if text: break

        if not text or len(text.strip()) < 40:
            raise ValueError("No substantial content was found in the page.")

        return text
    except Exception as e:
        raise RuntimeError(f"Failed to retrieve content from {url}: {e}")