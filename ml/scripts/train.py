#!/usr/bin/env python3
"""
AgroAI Plant Disease Model Training Pipeline

Performs transfer learning using MobileNetV3 or EfficientNet-B0 on the PlantVillage dataset.
Supports full parameter customization (epochs, batch size, image size, learning rate).
Saves best model weights, metadata, and exports ONNX for production inference.
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path
from PIL import Image

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import Dataset, DataLoader
    from torchvision import transforms, models
except ImportError:
    print("[!] PyTorch / Torchvision not installed.")
    print("    Install via: pip install -r ml/requirements.txt")
    print("    Or for CPU: pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
    sys.exit(1)

class PlantVillageDataset(Dataset):
    """PyTorch Dataset that loads directly from external file paths without copying."""
    def __init__(self, samples, transform=None):
        self.samples = samples  # List of {"path": str, "label": int, "class_id": str}
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        image_path = item["path"]
        label = item["label"]
        
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as e:
            # Fallback for corrupt image if any
            image = Image.new("RGB", (224, 224), color=(0, 128, 0))
            
        if self.transform:
            image = self.transform(image)
            
        return image, label

def get_model(model_name, num_classes, pretrained=True):
    """Load lightweight backbone with custom classification head for transfer learning."""
    name = model_name.lower().replace("-", "_")
    weights = "DEFAULT" if pretrained else None

    if name in ["mobilenet_v3_large", "mobilenetv3_large", "mobilenetv3"]:
        model = models.mobilenet_v3_large(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif name in ["mobilenet_v3_small", "mobilenetv3_small"]:
        model = models.mobilenet_v3_small(weights=weights)
        in_features = model.classifier[3].in_features
        model.classifier[3] = nn.Linear(in_features, num_classes)
    elif name in ["efficientnet_b0", "efficientnetb0"]:
        model = models.efficientnet_b0(weights=weights)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, num_classes)
    elif name in ["resnet18", "resnet_18"]:
        model = models.resnet18(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
    elif name in ["resnet50", "resnet_50"]:
        model = models.resnet50(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
    else:
        raise ValueError(f"Unsupported model architecture: {model_name}. Choose from mobilenet_v3_large, mobilenet_v3_small, efficientnet_b0, resnet18")

    return model

def build_transforms(img_size=224):
    """Data augmentation for training and standard normalization for validation."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(img_size, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((int(img_size * 1.14), int(img_size * 1.14))),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    return train_transform, val_transform

def export_onnx(model, save_path, img_size=224):
    """Export trained PyTorch model to ONNX for lightweight production inference."""
    try:
        model.eval()
        dummy_input = torch.randn(1, 3, img_size, img_size, device=next(model.parameters()).device)
        torch.onnx.export(
            model,
            dummy_input,
            save_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}}
        )
        print(f"[+] ONNX model exported to: {save_path}")
    except Exception as e:
        print(f"[!] ONNX export warning: {e}")

def train_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = (correct / total) * 100.0
    return epoch_loss, epoch_acc

def evaluate_epoch(model, dataloader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = (correct / total) * 100.0
    return epoch_loss, epoch_acc

def main():
    parser = argparse.ArgumentParser(description="AgroAI Plant Disease Model Training")
    parser.add_argument("--index_file", type=str, default="ml/dataset/dataset_index.json", help="Path to split index file")
    parser.add_argument("--data_dir", type=str, default=None, help="Dataset directory if preparing on the fly")
    parser.add_argument("--model_name", type=str, default="mobilenet_v3_large", help="mobilenet_v3_large, mobilenet_v3_small, efficientnet_b0, resnet18")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=32, help="Batch size (e.g. 16, 32, 64)")
    parser.add_argument("--img_size", type=int, default=224, help="Input image dimension (224)")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--weight_decay", type=float, default=1e-4, help="L2 regularization")
    parser.add_argument("--num_workers", type=int, default=0, help="DataLoader workers (0 for Windows compatibility)")
    parser.add_argument("--save_dir", type=str, default="ml/models", help="Directory to save trained models")
    parser.add_argument("--device", type=str, default="auto", help="'auto', 'cuda', or 'cpu'")
    parser.add_argument("--export_onnx", action="store_true", default=True, help="Export ONNX model after training")
    args = parser.parse_args()

    print("=" * 70)
    print("  AgroAI: Plant Disease Model Training Pipeline")
    print("=" * 70)

    # 1. Verify / Load Index
    if not os.path.exists(args.index_file):
        print(f"[*] Split index not found at '{args.index_file}'. Generating now...")
        from prepare_dataset import scan_dataset, create_stratified_splits, find_dataset_path, parse_class_name
        data_path = find_dataset_path(args.data_dir)
        if not data_path:
            print("[!] Error: Could not locate dataset. Pass --data_dir \"<path>\"")
            sys.exit(1)
        dataset_map, total_imgs = scan_dataset(data_path)
        splits, _, classes = create_stratified_splits(dataset_map)
        index_data = {
            "dataset_source": str(data_path),
            "total_images": total_imgs,
            "num_classes": len(classes),
            "classes": [parse_class_name(c) for c in classes],
            "splits": splits
        }
        Path(args.index_file).parent.mkdir(parents=True, exist_ok=True)
        with open(args.index_file, "w", encoding="utf-8") as f:
            json.dump(index_data, f, indent=2)
    else:
        with open(args.index_file, "r", encoding="utf-8") as f:
            index_data = json.load(f)

    splits = index_data["splits"]
    num_classes = index_data["num_classes"]
    classes = index_data["classes"]

    print(f"[*] Dataset Source:   {index_data.get('dataset_source', 'Custom')}")
    print(f"[*] Classes:          {num_classes}")
    print(f"[*] Train Samples:    {len(splits['train'])}")
    print(f"[*] Val Samples:      {len(splits['val'])}")
    print(f"[*] Test Samples:     {len(splits['test'])}")
    print(f"[*] Model Backbone:   {args.model_name}")
    print(f"[*] Epochs:           {args.epochs}")
    print(f"[*] Batch Size:       {args.batch_size}")
    print(f"[*] Image Size:       {args.img_size}x{args.img_size}")
    print(f"[*] Learning Rate:    {args.lr}")

    # 2. Setup Device
    if args.device == "auto":
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    else:
        device = torch.device(args.device)
    print(f"[*] Training on:      {device} ({'GPU' if device.type == 'cuda' else 'CPU'})")

    # 3. Build Transforms & DataLoaders
    train_tf, val_tf = build_transforms(args.img_size)
    train_dataset = PlantVillageDataset(splits["train"], transform=train_tf)
    val_dataset = PlantVillageDataset(splits["val"], transform=val_tf)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=(device.type == 'cuda'))
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size, shuffle=False, num_workers=args.num_workers)

    # 4. Instantiate Model
    model = get_model(args.model_name, num_classes=num_classes, pretrained=True)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    # 5. Training Loop
    save_dir = Path(args.save_dir)
    save_dir.mkdir(parents=True, exist_ok=True)
    best_val_acc = 0.0
    best_model_path = save_dir / "best_model.pth"
    history = []

    print("\n" + "=" * 70)
    print("  Starting Training...")
    print("=" * 70)

    start_time = time.time()
    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate_epoch(model, val_loader, criterion, device)
        scheduler.step()
        
        epoch_duration = time.time() - epoch_start
        current_lr = scheduler.get_last_lr()[0]

        history_entry = {
            "epoch": epoch,
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 2),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 2),
            "lr": current_lr,
            "duration_sec": round(epoch_duration, 1)
        }
        history.append(history_entry)

        is_best = val_acc > best_val_acc
        best_marker = " [★ BEST]" if is_best else ""
        
        print(f"Epoch [{epoch:>2}/{args.epochs:>2}] ({epoch_duration:.1f}s) | "
              f"Train Loss: {train_loss:.4f}, Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f}, Acc: {val_acc:.2f}%{best_marker}")

        if is_best:
            best_val_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": val_acc,
                "val_loss": val_loss,
                "model_name": args.model_name,
                "num_classes": num_classes,
                "img_size": args.img_size,
                "classes": classes
            }, best_model_path)

    total_time = time.time() - start_time
    print("=" * 70)
    print(f"[+] Training completed in: {total_time/60:.2f} minutes")
    print(f"[+] Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"[+] Model checkpoint saved to: {best_model_path}")

    # 6. Save Training History & Model Metadata
    with open(save_dir / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    metadata = {
        "model_name": args.model_name,
        "num_classes": num_classes,
        "best_val_acc": round(best_val_acc, 2),
        "img_size": args.img_size,
        "epochs_trained": args.epochs,
        "batch_size": args.batch_size,
        "train_samples": len(splits["train"]),
        "val_samples": len(splits["val"]),
        "test_samples": len(splits["test"]),
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "classes": classes
    }
    with open(save_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Model metadata saved to: {save_dir / 'model_metadata.json'}")

    # 7. Export ONNX
    if args.export_onnx:
        onnx_path = str(save_dir / "model.onnx")
        # Load best weights before export
        checkpoint = torch.load(best_model_path, map_location=device)
        model.load_state_dict(checkpoint["model_state_dict"])
        export_onnx(model, onnx_path, img_size=args.img_size)

    print("=" * 70)

if __name__ == "__main__":
    main()
