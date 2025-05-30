from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import nltk
import logging
nltk.download('punkt', quiet=True)

model = None
def get_model():
    global model
    if model is None:
        model = SentenceTransformer("all-MiniLM-L6-v2")
    return model

def create_vectorstore(text):
    """
    Splits text into sentences, encodes them, and creates a FAISS index.
    Returns a dict with the index and sentences for retrieval.
    """
    try:
        # Use NLTK for accurate sentence splitting
        from nltk.tokenize import sent_tokenize
        sentences = [s.strip() for s in sent_tokenize(text) if s.strip()]
        if not sentences:
            raise ValueError("No sentences found for vectorstore.")

        model = get_model()
        embeddings = model.encode(sentences)
        index = faiss.IndexFlatL2(embeddings.shape[1])
        index.add(np.array(embeddings))
        return {"index": index, "sentences": sentences, "embeddings": embeddings}
    except Exception as e:
        logging.error(f"Vectorstore creation failed: {e}")
        raise RuntimeError(f"Vectorstore creation failed: {e}")

def get_answer(question, store, k=3):
    """
    Returns the k most relevant sentences as the answer.
    """
    try:
        model = get_model()
        q_embed = model.encode([question])
        D, I = store["index"].search(np.array(q_embed), k)
        results = [store["sentences"][i] for i in I[0] if i < len(store["sentences"])]
        return " ".join(results)
    except Exception as e:
        logging.error(f"QA retrieval failed: {e}")
        raise RuntimeError(f"QA retrieval failed: {e}")

def get_answer_streaming(question, store, k=3):
    """
    Yields answer sentences one by one for streaming to the frontend.
    """
    try:
        model = get_model()
        q_embed = model.encode([question])
        D, I = store["index"].search(np.array(q_embed), k)
        for i in I[0]:
            if i < len(store["sentences"]):
                yield store["sentences"][i] + " "
    except Exception as e:
        logging.error(f"Streaming QA retrieval failed: {e}")
        yield f"Error: {e}"