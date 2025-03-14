from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, Trainer, TrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset
import torch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Use GPU if available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Load the summarization model and tokenizer (using pretrained reference)
def load_summarization_model(model_name="google/flan-t5-large"):
    """Loads the FLAN-T5 model and tokenizer for text summarization without redownloading if already available."""
    logging.info("Loading summarization model and tokenizer...")
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(device)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return model, tokenizer


# Load model and tokenizer once at the start
model, tokenizer = load_summarization_model()


# Function to split text into smaller chunks
def split_text(text, max_length=1024):
    """Splits text into chunks of max_length tokens using the tokenizer."""
    tokens = tokenizer.encode(text, truncation=False)
    chunks = [tokens[i:i + max_length] for i in range(0, len(tokens), max_length)]
    return [tokenizer.decode(chunk, skip_special_tokens=True) for chunk in chunks]


# Function to summarize text in chunks
def summarize_large_text(text, max_input_length=1024, max_output_length=300, min_output_length=100):
    """Splits large text into chunks, summarizes each chunk, and combines them."""
    logging.info("Processing large text by splitting into chunks...")

    # Split long text into smaller chunks
    chunks = split_text(text, max_length=max_input_length)
    summaries = []

    # Summarize each chunk
    for chunk in chunks:
        inputs = tokenizer(chunk, return_tensors="pt", truncation=True, max_length=max_input_length).to(device)

        # Generate summary
        with torch.no_grad():  # Avoid unnecessary gradient computations
            summary_ids = model.generate(
                inputs["input_ids"],
                max_length=max_output_length,
                min_length=min_output_length,
                length_penalty=2.0,
                num_beams=4
            )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        summaries.append(summary)

    # Combine chunk summaries and generate final summary
    logging.info("Generating final summary from chunk summaries...")
    final_summary = " ".join(summaries)

    # Recursively summarize if the output is still too long
    if len(final_summary) > max_input_length:
        return summarize_large_text(final_summary, max_input_length, max_output_length, min_output_length)

    return final_summary


# Fine-tuning function (avoiding redundant downloads)
def fine_tune_summarization_model(dataset_path="data.jsonl", model_name="google/flan-t5-large",
                                  output_dir="./fine_tuned_model"):
    """Fine-tunes the FLAN-T5 model for summarization using a dataset in JSONL format."""
    logging.info("Starting fine-tuning process...")

    dataset = load_dataset("json", data_files={"train": dataset_path})["train"]

    def preprocess_data(examples):
        inputs = examples["article"]
        targets = examples["summary"]
        model_inputs = tokenizer(inputs, max_length=1024, truncation=True, padding="max_length")
        labels = tokenizer(targets, max_length=300, truncation=True, padding="max_length")
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    dataset = dataset.map(preprocess_data, batched=True)

    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=5,
        save_steps=500,
        evaluation_strategy="epoch",
        logging_dir="./logs",
        save_total_limit=2,
        learning_rate=5e-5,
        weight_decay=0.01,
        fp16=torch.cuda.is_available(),
        push_to_hub=False  # Avoid unnecessary uploads
    )

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
    )

    trainer.train()
    logging.info("Summarization model fine-tuning complete!")
    return trainer


# Test case (Run when script is executed)
if __name__ == "__main__":
    test_text = "Your long test text goes here. Repeat multiple times to exceed 1024 tokens..."
    final_summary = summarize_large_text(test_text)
    print("Final Summary:", final_summary)

    # Fine-tune model
    trainer = fine_tune_summarization_model()
    logging.info("Summarization model setup and fine-tuning completed successfully!")
