#!/usr/bin/env python3
"""
AgroAI Plant Disease Model Evaluation Script

Evaluates the trained model checkpoint on the held-out test split.
Calculates Accuracy (Top-1 & Top-3), Precision, Recall, F1-score (Macro & Weighted),
and exports a detailed per-class classification report.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from PIL import Image

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import transforms
except ImportError:
    print("[!] PyTorch / Torchvision not installed.")
    print("    Install via: pip install -r ml/requirements.txt")
    sys.exit(1)

# Import dataset & model loaders from train script
from train import PlantVillageDataset, get_model

def calculate_metrics(y_true, y_pred, num_classes):
    """Calculate accuracy, precision, recall, and f1 scores without external dependencies if sklearn is missing."""
    try:
        from sklearn.metrics import precision_recall_fscore_support, accuracy_score, top_k_accuracy_score
        has_sklearn = True
    except ImportError:
        has_sklearn = False

    if has_sklearn:
        acc = accuracy_score(y_true, y_pred) * 100.0
        p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
        p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)
        p_class, r_class, f1_class, support = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)
        
        per_class = []
        for i in range(num_classes):
            per_class.append({
                "class_idx": i,
                "precision": round(float(p_class[i]) * 100.0, 2) if i < len(p_class) else 0.0,
                "recall": round(float(r_class[i]) * 100.0, 2) if i < len(r_class) else 0.0,
                "f1_score": round(float(f1_class[i]) * 100.0, 2) if i < len(f1_class) else 0.0,
                "support": int(support[i]) if i < len(support) else 0
            })

        return {
            "accuracy": round(float(acc), 2),
            "precision_macro": round(float(p_macro) * 100.0, 2),
            "recall_macro": round(float(r_macro) * 100.0, 2),
            "f1_macro": round(float(f1_macro) * 100.0, 2),
            "precision_weighted": round(float(p_weighted) * 100.0, 2),
            "recall_weighted": round(float(r_weighted) * 100.0, 2),
            "f1_weighted": round(float(f1_weighted) * 100.0, 2),
            "per_class": per_class
        }
    else:
        # Pure Python calculation fallback
        total = len(y_true)
        correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
        acc = (correct / total) * 100.0 if total > 0 else 0.0

        class_tp = [0] * num_classes
        class_fp = [0] * num_classes
        class_fn = [0] * num_classes
        class_support = [0] * num_classes

        for yt, yp in zip(y_true, y_pred):
            class_support[yt] += 1
            if yt == yp:
                class_tp[yt] += 1
            else:
                class_fp[yp] += 1
                class_fn[yt] += 1

        per_class = []
        p_list, r_list, f1_list = [], [], []

        for i in range(num_classes):
            tp = class_tp[i]
            fp = class_fp[i]
            fn = class_fn[i]
            supp = class_support[i]

            p = (tp / (tp + fp)) * 100.0 if (tp + fp) > 0 else 0.0
            r = (tp / (tp + fn)) * 100.0 if (tp + fn) > 0 else 0.0
            f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0.0

            p_list.append(p)
            r_list.append(r)
            f1_list.append(f1)

            per_class.append({
                "class_idx": i,
                "precision": round(p, 2),
                "recall": round(r, 2),
                "f1_score": round(f1, 2),
                "support": supp
            })

        return {
            "accuracy": round(acc, 2),
            "precision_macro": round(sum(p_list) / num_classes, 2),
            "recall_macro": round(sum(r_list) / num_classes, 2),
            "f1_macro": round(sum(f1_list) / num_classes, 2),
            "precision_weighted": round(sum(p * s for p, s in zip(p_list, class_support)) / total, 2),
            "recall_weighted": round(sum(r * s for r, s in zip(r_list, class_support)) / total, 2),
            "f1_weighted": round(sum(f * s for f, s in zip(f1_list, class_support)) / total, 2),
            "per_class": per_class
        }

def main():
    parser = argparse.ArgumentParser(description="AgroAI Plant Disease Model Evaluation")
    parser.add_argument("--model_path", type=str, default="ml/models/best_model.pth", help="Path to trained model checkpoint")
    parser.add_argument("--index_file", type=str, default="ml/dataset/dataset_index.json", help="Path to split index file")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size for evaluation")
    parser.add_argument("--device", type=str, default="auto", help="'auto', 'cuda', or 'cpu'")
    parser.add_argument("--output_report", type=str, default="ml/models/evaluation_report.json", help="Path to save evaluation JSON")
    args = parser.parse_args()

    print("=" * 70)
    print("  AgroAI: Plant Disease Model Evaluation on Held-Out Test Set")
    print("=" * 70)

    if not os.path.exists(args.model_path):
        print(f"[!] Error: Model checkpoint '{args.model_path}' not found.")
        print("    Please train a model first using: python ml/scripts/train.py")
        sys.exit(1)

    if not os.path.exists(args.index_file):
        print(f"[!] Error: Index file '{args.index_file}' not found.")
        sys.exit(1)

    # 1. Device
    if args.device == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(args.device)

    # 2. Load Checkpoint
    checkpoint = torch.load(args.model_path, map_location=device)
    model_name = checkpoint.get("model_name", "mobilenet_v3_large")
    num_classes = checkpoint.get("num_classes", 38)
    img_size = checkpoint.get("img_size", 224)
    classes_meta = checkpoint.get("classes", [])

    print(f"[*] Loaded Model:     {model_name}")
    print(f"[*] Number of Classes:{num_classes}")
    print(f"[*] Evaluation Device:{device}")

    # 3. Load Test Data
    with open(args.index_file, "r", encoding="utf-8") as f:
        index_data = json.load(f)
    test_samples = index_data["splits"]["test"]
    print(f"[*] Test Samples:     {len(test_samples)}")

    val_transform = transforms.Compose([
        transforms.Resize((int(img_size * 1.14), int(img_size * 1.14))),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_dataset = PlantVillageDataset(test_samples, transform=val_transform)
    test_loader = DataLoader(test_dataset, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # 4. Load Model
    model = get_model(model_name, num_classes=num_classes, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    # 5. Run Test Inference
    y_true = []
    y_pred = []
    top3_correct = 0
    total_count = 0

    print("[*] Running inference on test dataset...")
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            
            # Top-1
            _, preds = torch.max(outputs, 1)
            y_true.extend(labels.cpu().numpy().tolist())
            y_pred.extend(preds.cpu().numpy().tolist())

            # Top-3
            _, top3_preds = torch.topk(outputs, k=min(3, num_classes), dim=1)
            for label, top3 in zip(labels.cpu(), top3_preds.cpu()):
                if label in top3:
                    top3_correct += 1
            total_count += labels.size(0)

    top3_acc = (top3_correct / total_count) * 100.0 if total_count > 0 else 0.0

    # 6. Calculate Metrics
    metrics = calculate_metrics(y_true, y_pred, num_classes)
    metrics["top3_accuracy"] = round(top3_acc, 2)
    metrics["total_test_samples"] = len(y_true)

    # Pair with class metadata
    for item in metrics["per_class"]:
        idx = item["class_idx"]
        if idx < len(classes_meta):
            item["class_id"] = classes_meta[idx].get("class_id", "")
            item["crop"] = classes_meta[idx].get("crop", "")
            item["disease"] = classes_meta[idx].get("disease", "")

    # 7. Print Report
    print("\n" + "=" * 70)
    print("  OVERALL PERFORMANCE METRICS")
    print("=" * 70)
    print(f"  Top-1 Accuracy:       {metrics['accuracy']}%")
    print(f"  Top-3 Accuracy:       {metrics['top3_accuracy']}%")
    print(f"  Precision (Macro):    {metrics['precision_macro']}%")
    print(f"  Recall (Macro):       {metrics['recall_macro']}%")
    print(f"  F1-Score (Macro):     {metrics['f1_macro']}%")
    print(f"  Precision (Weighted): {metrics['precision_weighted']}%")
    print(f"  Recall (Weighted):    {metrics['recall_weighted']}%")
    print(f"  F1-Score (Weighted):  {metrics['f1_weighted']}%")
    print("-" * 70)

    print(f"{'Class Name':<42} | {'Prec (%)':>8} | {'Rec (%)':>8} | {'F1 (%)':>8} | {'Samples':>7}")
    print("-" * 70)
    for c in metrics["per_class"][:15]: # Display first 15 for concise view
        cname = c.get("class_id", f"Class {c['class_idx']}")
        print(f"{cname[:40]:<42} | {c['precision']:>8.1f} | {c['recall']:>8.1f} | {c['f1_score']:>8.1f} | {c['support']:>7}")
    if len(metrics["per_class"]) > 15:
        print(f"... and {len(metrics['per_class']) - 15} more classes (see full report).")
    print("=" * 70)

    # 8. Save JSON Report
    out_report_path = Path(args.output_report)
    out_report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_report_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"[+] Full evaluation report saved to: {out_report_path}")

if __name__ == "__main__":
    main()
