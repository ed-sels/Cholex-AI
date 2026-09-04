#!/usr/bin/env python3
"""
Cholera Twi Chatbot - Dataset Preprocessing & Pipeline Script
This script loads the seed dataset, preprocesses the Twi text queries,
splits the dataset into train/val/test sets, and saves them in HuggingFace Datasets format.
"""

import os
import re
import csv
import random

def preprocess_text(text):
    """
    Cleans and normalizes Twi text:
    1. Converts to lowercase.
    2. Removes standard punctuation except special Twi characters if any (like ɛ, ɔ).
    3. Normalizes multiple whitespaces into a single space.
    """
    if not isinstance(text, str):
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove punctuation while preserving Twi letters ɛ and ɔ
    text = re.sub(r'[^\w\sɛɔ]', '', text)
    # Normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def build_dataset():
    csv_path = 'data/cholera_twi.csv'
    output_dir = 'data/processed_dataset'
    
    if not os.path.exists(csv_path):
        # Fallback to absolute path or search if run from a different directory
        csv_path = os.path.join(os.path.dirname(__file__), '../data/cholera_twi.csv')
        output_dir = os.path.join(os.path.dirname(__file__), '../data/processed_dataset')
        
    print(f"Reading raw dataset from: {csv_path}")
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find raw dataset file at {csv_path}")
        return

    os.makedirs(output_dir, exist_ok=True)

    # Read records
    records = []
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_query = row.get('twi_query', '')
            cleaned_query = preprocess_text(raw_query)
            records.append({
                'twi_query': raw_query,
                'cleaned_query': cleaned_query,
                'intent': row.get('intent', ''),
                'twi_response': row.get('twi_response', ''),
                'english_translation': row.get('english_translation', ''),
                'source': row.get('source', '')
            })

    print(f"Loaded {len(records)} records.")

    # Shuffle the dataset
    random.seed(42)
    random.shuffle(records)

    # Calculate splits (70/15/15)
    total = len(records)
    train_end = int(total * 0.70)
    val_end = train_end + int(total * 0.15)

    train_set = records[:train_end]
    val_set = records[train_end:val_end]
    test_set = records[val_end:]

    print(f"Dataset split results:")
    print(f"  - Train: {len(train_set)} records")
    print(f"  - Validation: {len(val_set)} records")
    print(f"  - Test: {len(test_set)} records")

    # Export splits to CSV in HuggingFace compatible format
    splits = {
        'train': train_set,
        'validation': val_set,
        'test': test_set
    }

    for split_name, split_data in splits.items():
        split_file = os.path.join(output_dir, f"{split_name}.csv")
        with open(split_file, mode='w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['twi_query', 'cleaned_query', 'intent', 'twi_response', 'english_translation', 'source'])
            writer.writeheader()
            for row in split_data:
                writer.writerow(row)
        print(f"Saved {split_name} split to: {split_file}")

    print("Dataset building complete! Ready for HuggingFace datasets import or model fine-tuning.")

if __name__ == '__main__':
    build_dataset()
