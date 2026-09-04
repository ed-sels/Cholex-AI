#!/usr/bin/env python3
"""
Cholera Twi Intent Classifier - Training & Benchmark Pipeline
This script loads the raw dataset from data/cholera_twi.csv,
trains the TwiIntentModel, evaluates performance metrics,
and persists the trained model artifact to backend/model/trained_model.json.
"""

import sys
import os

# Add root directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ml_model import TwiIntentModel

def main():
    print("=" * 60)
    print(" Training Twi Cholera Intent Classification Model...")
    print("=" * 60)

    model = TwiIntentModel()
    try:
        metrics = model.train()
        model.save_model()

        print("\n Model Training Completed Successfully!")
        print(f" Dataset Size     : {metrics['train_samples']} samples")
        print(f" Vocabulary Size  : {metrics['vocabulary_size']} features")
        print(f" Accuracy         : {metrics['accuracy'] * 100:.2f}%")
        print(f" Macro F1-Score   : {metrics['macro_f1']:.4f}")
        print(f" Training Loss    : {metrics['training_loss']:.4f}")

        print("\n Per-Class Performance:")
        for intent, score in metrics['per_class_metrics'].items():
            print(f"  • {intent:20s}: F1={score['f1_score']:.2f} | Precision={score['precision']:.2f} | Recall={score['recall']:.2f} (n={score['support']})")

        print("\n🧪 Sample Inference Test:")
        test_queries = [
            "Mɛbɔ me ho ban afiri cholera ho sɛn?",
            "Sɛn na yɛyɛ ORS nsuo no?",
            "Yarefoɔ no n'ani apɔn na ɔrente nsɛm yie, dɛn na mɛyɛ?",
            "Mema wo akye, ete sɛn?"
        ]

        for q in test_queries:
            res = model.predict(q)
            print(f"\n  Query: '{q}'")
            print(f"  Predicted Intent: {res['predicted_intent']} (Confidence: {res['confidence']*100:.1f}%)")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"\n Training failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
