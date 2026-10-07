#!/usr/bin/env python3
"""
AgroAI Plant Disease Inference Engine

Accepts an image path, URL, or Base64 string and returns:
- Crop name
- Disease name (or Healthy)
- Confidence percentage
- Top 3 prediction candidates
- Actionable agronomy remedies (organic + chemical solutions)
"""

import os
import sys
import json
import base64
import argparse
from pathlib import Path
from io import BytesIO
from PIL import Image

# Default agronomy remedy knowledge base for PlantVillage classes
REMEDIES_KNOWLEDGE_BASE = {
    "Apple___Apple_scab": {
        "symptoms": "Olive-green to black velvety spots on leaves and fruit, causing premature leaf drop.",
        "organic_remedy": "Spray with sulfur-based organic fungicide, neem oil, or potassium bicarbonate. Rake and destroy fallen leaves.",
        "chemical_remedy": "Apply Captan, Mancozeb, or Myclobutanil early in the growing season before bud break.",
        "prevention": "Prune trees to improve canopy airflow and plant scab-resistant apple cultivars."
    },
    "Apple___Black_rot": {
        "symptoms": "Circular brown leaf spots with darker borders ('frog-eye' pattern) and dark mummified fruit.",
        "organic_remedy": "Prune out dead wood, cankers, and mummified fruit. Apply copper fungicide during dormancy.",
        "chemical_remedy": "Apply Thiophanate-methyl, Captan, or Strobilurin fungicides from tight cluster stage.",
        "prevention": "Remove dead wood within 100 meters of orchard; avoid overhead sprinkler irrigation."
    },
    "Apple___Cedar_apple_rust": {
        "symptoms": "Bright yellow-orange spots on upper leaf surfaces; tube-like fungal spore cups on leaf undersides.",
        "organic_remedy": "Apply copper or sulfur spray as soon as blossom buds show color.",
        "chemical_remedy": "Apply Myclobutanil or Chlorothalonil every 7-10 days during rainy spring periods.",
        "prevention": "Remove nearby eastern red cedar / juniper trees within 1-2 miles if feasible."
    },
    "Corn_(maize)___Common_rust_": {
        "symptoms": "Oval to elongate powdery golden-brown to cinnamon-brown pustules on both leaf surfaces.",
        "organic_remedy": "Apply Bacillus subtilis biopesticide or neem seed extract spray.",
        "chemical_remedy": "Apply Azoxystrobin, Pyraclostrobin, or Propiconazole at first sign of rust pustules.",
        "prevention": "Plant resistant maize hybrids and practice crop rotation with non-cereal crops."
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "symptoms": "Long, elliptical grayish-green or tan lesions (1 to 6 inches) on lower leaves progressing upwards.",
        "organic_remedy": "Apply copper-based fungicides and compost tea foliage sprays.",
        "chemical_remedy": "Apply Mancozeb, Azoxystrobin, or Propiconazole before tassel emergence.",
        "prevention": "Tillage to bury infected corn residue; maintain a 2-year crop rotation."
    },
    "Grape___Black_rot": {
        "symptoms": "Small reddish-brown circular spots on leaves; shriveled, hard, black mummified berries.",
        "organic_remedy": "Apply Bordeaux mixture or liquid copper hydroxide spray before rainfall.",
        "chemical_remedy": "Apply Myclobutanil, Mancozeb, or Tebuconazole from budbreak through 4 weeks post-bloom.",
        "prevention": "Prune vines for maximum sun exposure and destroy all mummified fruit clusters."
    },
    "Potato___Early_blight": {
        "symptoms": "Concentric dark brown rings ('target board' pattern) surrounded by a chlorotic yellow halo on older leaves.",
        "organic_remedy": "Apply copper hydroxide or potassium bicarbonate spray. Prune lower infected leaves.",
        "chemical_remedy": "Apply Chlorothalonil, Mancozeb, or Azoxystrobin at 7-14 day intervals.",
        "prevention": "Ensure adequate nitrogen fertility, practice 3-year crop rotation, and avoid overhead watering."
    },
    "Potato___Late_blight": {
        "symptoms": "Water-soaked dark lesions on leaf tips and margins; white fuzzy fungal growth on undersides in humid conditions.",
        "organic_remedy": "Apply copper sulfate (Bordeaux mixture) immediately; remove and burn severely infected foliage.",
        "chemical_remedy": "Apply Metalaxyl, Dimethomorph, or Cyazofamid combined with Mancozeb.",
        "prevention": "Plant certified disease-free seed tubers; monitor weather alerts for high humidity/fog."
    },
    "Tomato___Early_blight": {
        "symptoms": "Dark brown target-like concentric rings on lower leaves, causing yellowing and premature leaf fall.",
        "organic_remedy": "Apply copper soap spray, neem oil, or Bacillus amyloliquefaciens. Stake plants to keep leaves off soil.",
        "chemical_remedy": "Apply Chlorothalonil, Mancozeb, or Azoxystrobin every 7 to 10 days.",
        "prevention": "Mulch soil around plants to prevent soil splash; practice 2-3 year solanaceous crop rotation."
    },
    "Tomato___Late_blight": {
        "symptoms": "Large, irregular greasy dark water-soaked spots on leaves and stems; rapid wilting and fruit rot.",
        "organic_remedy": "Apply fixed copper fungicides before rain; destroy and bury infected plants (do not compost).",
        "chemical_remedy": "Apply Mandipropamid, Dimethomorph, or Chlorothalonil immediately upon symptom onset.",
        "prevention": "Avoid wetting foliage during irrigation, ensure wide plant spacing, and destroy volunteer tomato/potato plants."
    },
    "Tomato___Bacterial_spot": {
        "symptoms": "Small, dark, water-soaked circular spots with yellow halos on leaves; raised scabby lesions on green fruit.",
        "organic_remedy": "Apply copper hydroxide mixed with Bacillus subtilis or biological bactericides.",
        "chemical_remedy": "Apply Streptomycin sulfate or fixed copper combined with Mancozeb.",
        "prevention": "Use hot-water treated or certified disease-free seeds; disinfect pruning shears."
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "symptoms": "Upward curling and cupping of leaf margins, severe yellowing (chlorosis), stunting, and bushy upright growth.",
        "organic_remedy": "Install yellow sticky traps to catch whiteflies; spray insecticidal soap or neem oil to control vectors.",
        "chemical_remedy": "Apply Imidacloprid, Acetamiprid, or Spiromesifen to control whitefly populations.",
        "prevention": "Use fine mesh insect netting (50-mesh) over nurseries; plant TYLCV-resistant hybrids."
    }
}

DEFAULT_HEALTHY_REMEDY = {
    "symptoms": "Foliage is vibrant, green, and shows no signs of fungal, bacterial, or pest infection.",
    "organic_remedy": "Maintain regular watering schedule, organic compost dressing, and balanced micro-nutrients.",
    "chemical_remedy": "No chemical intervention needed. Apply preventative bio-fertilizer as scheduled.",
    "prevention": "Continue good crop hygiene, adequate sunlight, and balanced soil moisture."
}

def load_classes(class_json_path="ml/inference/class_names.json"):
    """Load class names and metadata mapping."""
    if os.path.exists(class_json_path):
        with open(class_json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def preprocess_image(image_input, img_size=224):
    """Load and preprocess image from file path, URL, or Base64."""
    if isinstance(image_input, str):
        if image_input.startswith("data:image"):
            # Base64 string
            base64_data = image_input.split(",")[1] if "," in image_input else image_input
            image_bytes = base64.b64decode(base64_data)
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
        elif image_input.startswith("http://") or image_input.startswith("https://"):
            import urllib.request
            req = urllib.request.Request(image_input, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp:
                img = Image.open(BytesIO(resp.read())).convert("RGB")
        else:
            img = Image.open(image_input).convert("RGB")
    elif isinstance(image_input, bytes):
        img = Image.open(BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    # Preprocessing identical to validation transform
    import torchvision.transforms as transforms
    tf = transforms.Compose([
        transforms.Resize((int(img_size * 1.14), int(img_size * 1.14))),
        transforms.CenterCrop(img_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    tensor = tf(img).unsqueeze(0)
    return tensor, img

def predict_disease(image_input, model_path="ml/models/best_model.pth", class_json_path="ml/inference/class_names.json", device="cpu"):
    """
    Run inference on a single image and return structured crop/disease analysis.
    """
    import torch
    import torch.nn.functional as F

    classes_list = load_classes(class_json_path)
    if not classes_list:
        raise FileNotFoundError(f"Classes file not found at: {class_json_path}")

    # 1. Load Model
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model checkpoint not found at: {model_path}. Train the model first via ml/scripts/train.py")

    dev = torch.device(device)
    checkpoint = torch.load(model_path, map_location=dev)
    
    model_name = checkpoint.get("model_name", "mobilenet_v3_large")
    num_classes = checkpoint.get("num_classes", len(classes_list))
    img_size = checkpoint.get("img_size", 224)

    # Instantiate model structure
    from train import get_model
    model = get_model(model_name, num_classes=num_classes, pretrained=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(dev)
    model.eval()

    # 2. Preprocess & Image Quality Inspection
    tensor, raw_pil_img = preprocess_image(image_input, img_size=img_size)

    # Resolution Check
    if raw_pil_img.width < 120 or raw_pil_img.height < 120:
        raise ValueError("Image quality is too low for reliable analysis. Please capture a clearer photo (minimum 120x120 px).")

    # Extreme Darkness / Brightness Check
    import numpy as np
    gray_arr = np.array(raw_pil_img.convert("L"))
    mean_lum = float(np.mean(gray_arr))
    if mean_lum < 24.0:
        raise ValueError("Image quality is too low for reliable analysis. Image is extremely dark. Please capture a clearer photo.")
    if mean_lum > 238.0:
        raise ValueError("Image quality is too low for reliable analysis. Image is overexposed/too bright. Please capture a clearer photo.")

    tensor = tensor.to(dev)

    # 3. Inference
    with torch.no_grad():
        logits = model(tensor)
        probabilities = F.softmax(logits, dim=1).squeeze(0)

    # 4. Top 3 Predictions & Ambiguity Analysis
    top3_prob, top3_indices = torch.topk(probabilities, k=min(3, num_classes))
    top3_list = []
    for p, idx in zip(top3_prob, top3_indices):
        idx_val = idx.item()
        c_meta = classes_list[idx_val] if idx_val < len(classes_list) else {"class_id": f"Class_{idx_val}", "crop": "Unknown", "disease": "Unknown", "is_healthy": False}
        top3_list.append({
            "class_id": c_meta.get("class_id"),
            "crop": c_meta.get("crop"),
            "disease": c_meta.get("disease"),
            "confidence": round(p.item() * 100.0, 2),
            "is_healthy": c_meta.get("is_healthy", False)
        })

    primary = top3_list[0]
    class_id = primary["class_id"]
    is_healthy = primary["is_healthy"]

    # Calculate Margin & Ambiguity between Top 1 and Top 2
    top1_conf = primary["confidence"]
    top2_conf = top3_list[1]["confidence"] if len(top3_list) > 1 else 0.0
    margin = round(top1_conf - top2_conf, 2)
    is_ambiguous = margin < 12.0

    # Output State: SUPPORTED / HIGH CONFIDENCE, SUPPORTED / LOW CONFIDENCE, or UNCERTAIN
    if is_ambiguous:
        reliability = "UNCERTAIN"
        reliability_label = "UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE"
        uncertainty_reason = f"Ambiguous prediction between {primary['disease']} ({top1_conf}%) and {top3_list[1]['disease']} ({top2_conf}%). Retake a clearer photo."
    elif top1_conf >= 75.0 and margin >= 15.0:
        reliability = "HIGH_CONFIDENCE"
        reliability_label = "SUPPORTED / HIGH CONFIDENCE"
        uncertainty_reason = None
    elif top1_conf >= 50.0:
        reliability = "LOW_CONFIDENCE"
        reliability_label = "SUPPORTED / LOW CONFIDENCE"
        uncertainty_reason = "Moderate confidence. Inspect foliage closely."
    else:
        reliability = "UNCERTAIN"
        reliability_label = "UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE"
        uncertainty_reason = "Model confidence is low. Please capture a clearer leaf photo."

    # 5. Lookup Remedy
    remedy_info = REMEDIES_KNOWLEDGE_BASE.get(class_id, {
        "symptoms": f"Visible leaf abnormalities consistent with {primary['disease']}.",
        "organic_remedy": "Apply general copper soap spray or neem oil biopesticide.",
        "chemical_remedy": "Apply broad-spectrum agricultural fungicide or bactericide.",
        "prevention": "Maintain proper air circulation, avoid overhead watering, and prune affected parts."
    } if not is_healthy else DEFAULT_HEALTHY_REMEDY)

    result = {
        "crop": primary["crop"],
        "disease": primary["disease"],
        "severity": "None" if is_healthy else ("High" if primary["confidence"] > 85 else "Medium"),
        "confidence": primary["confidence"],
        "reliability": reliability,
        "reliability_label": reliability_label,
        "is_ambiguous": is_ambiguous,
        "margin": margin,
        "uncertainty_reason": uncertainty_reason,
        "raw_class": class_id,
        "is_healthy": is_healthy,
        "symptoms": remedy_info["symptoms"],
        "remedy": f"Organic: {remedy_info['organic_remedy']} | Chemical: {remedy_info['chemical_remedy']}",
        "organic_remedy": remedy_info["organic_remedy"],
        "chemical_remedy": remedy_info["chemical_remedy"],
        "prevention": remedy_info["prevention"],
        "top_3": top3_list
    }

    return result

def main():
    parser = argparse.ArgumentParser(description="AgroAI Plant Disease Single Image Prediction")
    parser.add_argument("--image", type=str, required=True, help="Path or URL to leaf image")
    parser.add_argument("--model_path", type=str, default="ml/models/best_model.pth", help="Path to model weights")
    parser.add_argument("--class_names", type=str, default="ml/inference/class_names.json", help="Path to class_names.json")
    parser.add_argument("--device", type=str, default="cpu", help="'cpu' or 'cuda'")
    args = parser.parse_args()

    print("=" * 70)
    print("  AgroAI: Leaf Disease Prediction (Reliability Safe)")
    print("=" * 70)
    print(f"[*] Input Image: {args.image}")

    try:
        res = predict_disease(args.image, model_path=args.model_path, class_json_path=args.class_names, device=args.device)
        print("\n[+] DIAGNOSTIC RESULT:")
        print(f"  Crop:         {res['crop']}")
        print(f"  Condition:    {res['disease']}")
        print(f"  AI Confidence:{res['confidence']}%")
        print(f"  Reliability:  {res['reliability_label']}")
        if res["is_ambiguous"]:
            print(f"  [!] Warning:  Prediction is ambiguous (margin {res['margin']}%)")
        print(f"  Severity:     {res['severity']}")
        print(f"  Symptoms:     {res['symptoms']}")
        print(f"  Organic:      {res['organic_remedy']}")
        print(f"  Chemical:     {res['chemical_remedy']}")
        print(f"  Prevention:   {res['prevention']}")
        print("\n[+] TOP CANDIDATES:")
        for idx, cand in enumerate(res["top_3"], 1):
            print(f"  {idx}. {cand['crop']} - {cand['disease']} ({cand['confidence']}%)")
        print("=" * 70)
    except Exception as e:
        print(f"[!] Prediction Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
