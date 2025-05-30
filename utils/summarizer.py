from transformers import pipeline
import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def summarize_text(text, max_length=300):
    text = text.strip().replace("\n", " ")
    return summarizer(text[:1000], max_length=max_length, min_length=80, do_sample=False)[0]["summary_text"]
