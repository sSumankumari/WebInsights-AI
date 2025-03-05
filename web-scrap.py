# WebInsightAI - Intelligent URL Summarization & Question Answering Tool

# URL Information Retrieval (Web Scraping)
import requests
from bs4 import BeautifulSoup
import newspaper
import pandas as pd

def scrape_url(url):
    try:
        article = newspaper.Article(url)
        article.download()
        article.parse()
        title = article.title
        text = article.text
        return {"title": title, "content": text}
    except Exception as e:
        return {"error": str(e)}

def extract_text_from_html(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        paragraphs = soup.find_all('p')  # Extracting text from <p> tags
        text = " ".join([p.get_text() for p in paragraphs])
        return text
    except Exception as e:
        return str(e)

# Save Retrieved Data to CSV
def save_to_csv(data, filename="scraped_data.csv"):
    df = pd.DataFrame([data])
    df.to_csv(filename, mode='a', index=False, header=not pd.io.common.file_exists(filename))

# Test URL Scraping
if __name__ == "__main__":
    url = "https://pypi.org/project/scikit-learn/"
    scraped_data = scrape_url(url)
    save_to_csv(scraped_data)
    print("Scraped Data:", scraped_data)

print("WebInsightAI - Project initialization and URL info retrieval setup complete!")
