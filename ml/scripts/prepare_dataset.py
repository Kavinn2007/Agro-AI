#!/usr/bin/env python3
"""
AgroAI PlantVillage Dataset Preparation & Indexing Script

Inspects the external PlantVillage segmented dataset, discovers classes automatically,
generates clean label metadata, and builds reproducible train/val/test splits
WITHOUT copying any images into the repository.
"""

import os
import sys
import json
import argparse
import random
from pathlib import Path
from collections import Counter, defaultdict

# Default candidate search paths for PlantVillage segmented dataset
DEFAULT_DATASET_PATHS = [
    r"C:\Users\HP\Downloads\archive (4)\plantvillage dataset\segmented",
    r"C:\Users\Padmanaban\Downloads\archive (4)\plantvillage dataset\segmented",
    r"C:\Users\HP\Downloads\plantvillage dataset\segmented",
    r"C:\Users\Padmanaban\Downloads\plantvillage dataset\segmented",
]

ARCHIVE_ZIP_PATHS = [
    r"C:\Users\Padmanaban\Downloads\archive (4).zip",
    r"C:\Users\HP\Downloads\archive (4).zip",
]

def find_dataset_path(provided_path=None):
    """Locate the dataset directory or prompt if unextracted."""
    if provided_path and os.path.exists(provided_path):
        return Path(provided_path)

    for p in DEFAULT_DATASET_PATHS:
        if os.path.exists(p):
            return Path(p)

    return None

def parse_class_name(folder_name):
    """
    Parse PlantVillage folder format: Crop___Disease
    e.g., 'Tomato___Late_blight' -> crop: 'Tomato', disease: 'Late Blight'
    """
    if "___" in folder_name:
        parts = folder_name.split("___", 1)
        raw_crop, raw_disease = parts[0], parts[1]
    else:
        raw_crop, raw_disease = folder_name, "Unknown"

    crop = raw_crop.replace("_", " ").strip()
    disease = raw_disease.replace("_", " ").strip()
    is_healthy = "healthy" in disease.lower() or "healthy" in folder_name.lower()
    
    if is_healthy:
        disease = "Healthy"

    # Default severity estimation
    if is_healthy:
        severity = "None"
    elif any(term in disease.lower() for term in ["virus", "greening", "black rot", "late blight"]):
        severity = "High"
    elif any(term in disease.lower() for term in ["mold", "mildew"]):
        severity = "Low"
    else:
        severity = "Medium"

    return {
        "class_id": folder_name,
        "crop": crop,
        "disease": disease,
        "is_healthy": is_healthy,
        "severity": severity
    }

def scan_dataset(data_dir):
    """Scan the dataset directory and discover all image files grouped by class."""
    data_path = Path(data_dir)
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset path not found: {data_dir}")

    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".JPG", ".JPEG", ".PNG"}
    class_dirs = sorted([d for d in data_path.iterdir() if d.is_dir()])
    
    if not class_dirs:
        raise ValueError(f"No class subdirectories found in: {data_dir}")

    dataset_map = defaultdict(list)
    total_images = 0

    for class_dir in class_dirs:
        class_name = class_dir.name
        images = [
            str(f.resolve()) for f in class_dir.iterdir() 
            if f.is_file() and f.suffix in valid_extensions
        ]
        if images:
            dataset_map[class_name] = images
            total_images += len(images)

    return dataset_map, total_images

def create_stratified_splits(dataset_map, train_ratio=0.70, val_ratio=0.15, test_ratio=0.15, seed=42):
    """Create deterministic, stratified train/val/test splits without copying files."""
    random.seed(seed)
    
    splits = {
        "train": [],
        "val": [],
        "test": []
    }
    
    split_summary = defaultdict(lambda: {"train": 0, "val": 0, "test": 0, "total": 0})
    class_names = sorted(list(dataset_map.keys()))
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}

    for class_name, img_paths in dataset_map.items():
        shuffled = list(img_paths)
        random.shuffle(shuffled)
        n = len(shuffled)
        
        n_train = int(n * train_ratio)
        n_val = int(n * val_ratio)
        
        train_imgs = shuffled[:n_train]
        val_imgs = shuffled[n_train:n_train + n_val]
        test_imgs = shuffled[n_train + n_val:]
        
        class_idx = class_to_idx[class_name]
        
        for p in train_imgs:
            splits["train"].append({"path": p, "class_id": class_name, "label": class_idx})
        for p in val_imgs:
            splits["val"].append({"path": p, "class_id": class_name, "label": class_idx})
        for p in test_imgs:
            splits["test"].append({"path": p, "class_id": class_name, "label": class_idx})
            
        split_summary[class_name]["train"] = len(train_imgs)
        split_summary[class_name]["val"] = len(val_imgs)
        split_summary[class_name]["test"] = len(test_imgs)
        split_summary[class_name]["total"] = n

    return splits, split_summary, class_names

def main():
    parser = argparse.ArgumentParser(description="AgroAI PlantVillage Dataset Preparation & Indexing")
    parser.add_argument("--data_dir", type=str, default=None, help="Path to PlantVillage segmented directory")
    parser.add_argument("--output_index", type=str, default=r"ml/dataset/dataset_index.json", help="Path to output split index")
    parser.add_argument("--class_output", type=str, default=r"ml/inference/class_names.json", help="Path to class_names.json")
    parser.add_argument("--train_ratio", type=float, default=0.70)
    parser.add_argument("--val_ratio", type=float, default=0.15)
    parser.add_argument("--test_ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    print("=" * 70)
    print("  AgroAI: PlantVillage Dataset Preparation & Discovery")
    print("=" * 70)

    dataset_path = find_dataset_path(args.data_dir)
    if not dataset_path:
        print(f"\n[!] Dataset directory not found at candidate locations.")
        print(f"    Expected path: C:\\Users\\HP\\Downloads\\archive (4)\\plantvillage dataset\\segmented")
        print(f"    Please provide the path using --data_dir \"<path>\"")
        print("=" * 70)
        sys.exit(1)

    print(f"[*] Found dataset at: {dataset_path}")
    print("[*] Scanning class folders...")
    
    dataset_map, total_images = scan_dataset(dataset_path)
    classes = sorted(list(dataset_map.keys()))
    
    print(f"[+] Total classes detected: {len(classes)}")
    print(f"[+] Total images detected:  {total_images}")

    # Generate metadata for classes
    class_metadata = []
    for idx, c in enumerate(classes):
        meta = parse_class_name(c)
        meta["index"] = idx
        meta["image_count"] = len(dataset_map[c])
        class_metadata.append(meta)

    # Stratified Splits
    print("[*] Generating reproducible 70/15/15 train/val/test split index...")
    splits, split_summary, class_names = create_stratified_splits(
        dataset_map, 
        train_ratio=args.train_ratio, 
        val_ratio=args.val_ratio, 
        test_ratio=args.test_ratio, 
        seed=args.seed
    )

    # Save index & class metadata
    out_index_path = Path(args.output_index)
    out_index_path.parent.mkdir(parents=True, exist_ok=True)
    
    index_payload = {
        "dataset_source": str(dataset_path),
        "total_images": total_images,
        "num_classes": len(classes),
        "split_counts": {
            "train": len(splits["train"]),
            "val": len(splits["val"]),
            "test": len(splits["test"])
        },
        "classes": class_metadata,
        "splits": splits
    }

    with open(out_index_path, "w", encoding="utf-8") as f:
        json.dump(index_payload, f, indent=2)
    print(f"[+] Split index saved to: {out_index_path}")

    # Save class_names.json
    out_class_path = Path(args.class_output)
    out_class_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_class_path, "w", encoding="utf-8") as f:
        json.dump(class_metadata, f, indent=2)
    print(f"[+] Class metadata saved to: {out_class_path}")

    # Print summary
    print("\n" + "-" * 70)
    print(f"{'Class ID':<45} | {'Train':>6} | {'Val':>5} | {'Test':>5} | {'Total':>6}")
    print("-" * 70)
    for c in classes:
        s = split_summary[c]
        print(f"{c:<45} | {s['train']:>6} | {s['val']:>5} | {s['test']:>5} | {s['total']:>6}")
    print("-" * 70)
    print(f"{'TOTAL':<45} | {len(splits['train']):>6} | {len(splits['val']):>5} | {len(splits['test']):>5} | {total_images:>6}")
    print("=" * 70)

if __name__ == "__main__":
    main()
