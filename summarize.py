from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, Trainer, TrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset
import torch


# Function to Load Pre-trained Summarization Model
def load_summarization_model(model_name="google/flan-t5-base"):
    """Loads the FLAN-T5 model and tokenizer for text summarization."""
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    return model, tokenizer


# Initialize Model and Tokenizer
model, tokenizer = load_summarization_model()


# Function to Generate Summaries
def generate_summary(text, model, tokenizer, max_input_length=512, max_output_length=150, min_output_length=50):
    """Generates a summary for the given text input using the FLAN-T5 model."""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=max_input_length)
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=max_output_length,
        min_length=min_output_length,
        length_penalty=2.0,
        num_beams=4
    )
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary


# Fine-Tuning FLAN-T5 for Summarization

def fine_tune_summarization_model(dataset_path="data.jsonl", model_name="google/flan-t5-base",
                                  output_dir="./fine_tuned_model"):
    """Fine-tunes the FLAN-T5 model for summarization using a dataset in JSONL format."""

    # Load dataset from a JSONL file
    dataset = load_dataset("json", data_files={"train": dataset_path})["train"]

    # Preprocess data
    def preprocess_data(examples):
        inputs = examples["article"]
        targets = examples["summary"]
        model_inputs = tokenizer(inputs, max_length=512, truncation=True, padding="max_length")
        labels = tokenizer(targets, max_length=150, truncation=True, padding="max_length")
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    dataset = dataset.map(preprocess_data, batched=True)

    # Define training arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=3,
        save_steps=500,
        evaluation_strategy="epoch",
        logging_dir="./logs",
        save_total_limit=2,
        fp16=torch.cuda.is_available()  # Enable mixed precision if available
    )

    # Data collator to handle padding
    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
    )

    # Train the model
    trainer.train()
    print("Summarization model fine-tuning process complete!")
    return trainer


# Run Fine-Tuning
trainer = fine_tune_summarization_model()

print("Summarization model setup and fine-tuning completed successfully!")
