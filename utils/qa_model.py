from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def create_vectorstore(text):
    sentences = text.split(". ")
    embeddings = model.encode(sentences)
    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(np.array(embeddings))
    return {"index": index, "sentences": sentences, "embeddings": embeddings}

def get_answer(question, store):
    q_embed = model.encode([question])
    D, I = store["index"].search(np.array(q_embed), k=3)
    results = [store["sentences"][i] for i in I[0]]
    return " ".join(results)
