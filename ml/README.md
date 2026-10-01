# AgroAI Machine Learning Subsystem: Plant Disease Detection

This module contains the end-to-end Machine Learning pipeline for training, evaluating, and serving lightweight deep learning models (MobileNetV3 / EfficientNet-B0) on the PlantVillage dataset.

---

## Directory Structure

```
ml/
├── dataset/
│   ├── README.md               # Dataset documentation & statistics
│   └── dataset_index.json      # Generated 70/15/15 train/val/test index
├── models/
│   ├── README.md               # Model checkpoint storage
│   ├── best_model.pth          # Saved best weights (after training)
│   ├── model_metadata.json     # Hyperparameters & metadata
│   └── model.onnx              # Exported ONNX format for fast inference
├── scripts/
│   ├── prepare_dataset.py      # Automated class discovery & index splitting
│   ├── train.py                # Transfer learning training pipeline
│   └── evaluate.py             # Accuracy, Precision, Recall, F1 evaluation
├── inference/
│   ├── predict.py              # CLI & module for single-image diagnosis
│   └── class_names.json        # 38 PlantVillage classes with clean labels
├── requirements.txt            # ML dependencies
└── README.md                   # This documentation
```

---

## 1. Setup & Dependencies

Install the required Python machine learning dependencies:

```bash
# Using standard pip
pip install -r ml/requirements.txt

# Or for CPU-only PyTorch (lightweight / recommended if no dedicated NVIDIA GPU)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install pillow numpy scikit-learn matplotlib tqdm
```

---

## 2. Dataset Preparation & Discovery

The actual PlantVillage dataset is kept **outside** this repository (e.g. at `C:\Users\HP\Downloads\archive (4)\plantvillage dataset\segmented` or `C:\Users\Padmanaban\Downloads\archive (4)\plantvillage dataset\segmented`).

To inspect classes and build the train/val/test index without copying any image files:

```bash
python ml/scripts/prepare_dataset.py --data_dir "C:\Users\HP\Downloads\archive (4)\plantvillage dataset\segmented"
```

This creates:
1. `ml/dataset/dataset_index.json` (Stratified 70% Train / 15% Validation / 15% Test index).
2. `ml/inference/class_names.json` (38 detected classes with clean crop, disease, and severity tags).

---

## 3. Training the Model

Train a transfer learning model (MobileNetV3-Large by default) with adjustable parameters:

```bash
# Standard training (MobileNetV3-Large, 10 epochs, batch size 32)
python ml/scripts/train.py --epochs 10 --batch_size 32 --lr 0.001 --model_name mobilenet_v3_large

# Fast test run (3 epochs, smaller batch size)
python ml/scripts/train.py --epochs 3 --batch_size 16 --model_name mobilenet_v3_small

# Using EfficientNet-B0
python ml/scripts/train.py --epochs 10 --batch_size 16 --model_name efficientnet_b0
```

### Adjustable Training Flags:
| Argument | Default | Description |
| :--- | :--- | :--- |
| `--model_name` | `mobilenet_v3_large` | Architecture: `mobilenet_v3_large`, `mobilenet_v3_small`, `efficientnet_b0`, `resnet18` |
| `--epochs` | `10` | Number of training epochs |
| `--batch_size` | `32` | Batch size (16 for low RAM/CPU, 32 or 64 for GPU) |
| `--img_size` | `224` | Input image resolution (224x224) |
| `--lr` | `0.001` | Initial learning rate |
| `--device` | `auto` | `auto`, `cuda` (GPU), or `cpu` |
| `--save_dir` | `ml/models` | Checkpoint output folder |

---

## 4. Evaluating the Model

Calculate Top-1 and Top-3 accuracy, precision, recall, and F1 score on the held-out test split (8,154 images):

```bash
python ml/scripts/evaluate.py --model_path ml/models/best_model.pth
```

---

## 5. Running Predictions (Inference)

Run leaf diagnosis on any image file, URL, or base64 string:

```bash
python ml/inference/predict.py --image "path/to/leaf_photo.jpg"
```

### Example Output:
```
======================================================================
  AgroAI: Leaf Disease Prediction
======================================================================
[*] Input Image: sample_leaf.jpg

[+] DIAGNOSTIC RESULT:
  Crop:        Tomato
  Condition:   Late Blight
  Confidence:  96.8%
  Severity:    High
  Symptoms:    Large, irregular greasy dark water-soaked spots on leaves and stems; rapid wilting and fruit rot.
  Organic:     Apply fixed copper fungicides before rain; destroy and bury infected plants (do not compost).
  Chemical:    Apply Mandipropamid, Dimethomorph, or Chlorothalonil immediately upon symptom onset.
  Prevention:  Avoid wetting foliage during irrigation, ensure wide plant spacing, and destroy volunteer tomato/potato plants.

[+] TOP 3 CANDIDATES:
  1. Tomato - Late Blight (96.8%)
  2. Tomato - Early Blight (2.3%)
  3. Tomato - Healthy (0.4%)
======================================================================
```
