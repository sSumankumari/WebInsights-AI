import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
from transformers import pipeline, AutoTokenizer
import logging

# Lazy-load summarizer and tokenizer
_summarizer = None
_tokenizer = None

def get_summarizer():
    global _summarizer
    if _summarizer is None:
        _summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    return _summarizer

def get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")
    return _tokenizer

def summarize_text(text, max_length=300):
    """
    Summarizes input text. Dynamically sets max_length so it's never greater than input length.
    Automatically chunks long text and combines summaries.
    Returns the final summary string.
    """
    try:
        summarizer = get_summarizer()
        tokenizer = get_tokenizer()
        text = text.strip().replace("\n", " ")
        if len(text) < 80:
            return text

        # Huggingface models have max input size (usually 1024 tokens); chunk if needed.
        chunk_size = 900  # In characters for slicing, but we use token count below

        # Split text into chunks based on token length
        inputs = tokenizer(text, return_tensors="pt", truncation=False)
        input_ids = inputs["input_ids"][0]
        total_tokens = len(input_ids)
        max_model_input = 1024  # distilbart-cnn-12-6 supports up to 1024 tokens

        # Function to split by tokens if needed
        def split_into_token_chunks(text, tokenizer, max_tokens):
            words = text.split()
            chunks = []
            current_chunk = []
            for word in words:
                current_chunk.append(word)
                token_count = len(tokenizer(" ".join(current_chunk))["input_ids"])
                if token_count >= max_tokens:
                    chunks.append(" ".join(current_chunk))
                    current_chunk = []
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            return chunks

        # Use token-based chunking for best results
        chunks = split_into_token_chunks(text, tokenizer, max_model_input)

        summaries = []
        for chunk in chunks:
            input_length = len(tokenizer(chunk)["input_ids"])
            effective_max_length = min(max_length, max(30, int(input_length * 0.5)))
            effective_min_length = min(80, max(10, int(effective_max_length // 2)))
            summary = summarizer(
                chunk,
                max_length=effective_max_length,
                min_length=effective_min_length,
                do_sample=False
            )[0]["summary_text"]
            summaries.append(summary)

        # If multiple summaries, summarize the summaries.
        if len(summaries) > 1:
            joined = " ".join(summaries)
            input_length = len(tokenizer(joined)["input_ids"])
            effective_max_length = min(max_length, max(30, int(input_length * 0.5)))
            effective_min_length = min(80, max(10, int(effective_max_length // 2)))
            summary_final = summarizer(
                joined,
                max_length=effective_max_length,
                min_length=effective_min_length,
                do_sample=False
            )[0]["summary_text"]
            return summary_final
        else:
            return summaries[0]
    except Exception as e:
        logging.error(f"Summarization failed: {e}")
        raise RuntimeError(f"Summarization failed: {e}")