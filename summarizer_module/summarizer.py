from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

# Load model & tokenizer once at startup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_name = "google/flan-t5-large"

model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
tokenizer = AutoTokenizer.from_pretrained(model_name)

def summarize_text(text, max_input_length=1024, max_output_length=300, min_output_length=100):
    """Summarizes the given text using FLAN-T5."""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=max_input_length).to(device)

    with torch.no_grad():  # No gradient computation needed for inference
        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=max_output_length,
            min_length=min_output_length,
            length_penalty=2.0,
            num_beams=4
        )

    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)
