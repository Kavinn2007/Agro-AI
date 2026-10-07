/**
 * AgroAI Plant Disease Model Classes & Reliability Evaluation
 * Strictly based on the trained 38 PlantVillage classes across 14 crops.
 */

export const SUPPORTED_CROPS = [
  'Apple',
  'Blueberry',
  'Cherry',
  'Corn',
  'Grape',
  'Orange',
  'Peach',
  'Pepper',
  'Potato',
  'Raspberry',
  'Soybean',
  'Squash',
  'Strawberry',
  'Tomato'
];

export const PLANTVILLAGE_CLASSES = [
  { classId: 'Apple___Apple_scab', crop: 'Apple', disease: 'Apple scab', isHealthy: false, severity: 'Medium' },
  { classId: 'Apple___Black_rot', crop: 'Apple', disease: 'Black rot', isHealthy: false, severity: 'High' },
  { classId: 'Apple___Cedar_apple_rust', crop: 'Apple', disease: 'Cedar apple rust', isHealthy: false, severity: 'Medium' },
  { classId: 'Apple___healthy', crop: 'Apple', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Blueberry___healthy', crop: 'Blueberry', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Cherry_(including_sour)___Powdery_mildew', crop: 'Cherry', disease: 'Powdery mildew', isHealthy: false, severity: 'Low' },
  { classId: 'Cherry_(including_sour)___healthy', crop: 'Cherry', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', crop: 'Corn', disease: 'Gray leaf spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Corn_(maize)___Common_rust_', crop: 'Corn', disease: 'Common rust', isHealthy: false, severity: 'Medium' },
  { classId: 'Corn_(maize)___Northern_Leaf_Blight', crop: 'Corn', disease: 'Northern Leaf Blight', isHealthy: false, severity: 'Medium' },
  { classId: 'Corn_(maize)___healthy', crop: 'Corn', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Grape___Black_rot', crop: 'Grape', disease: 'Black rot', isHealthy: false, severity: 'High' },
  { classId: 'Grape___Esca_(Black_Measles)', crop: 'Grape', disease: 'Esca (Black Measles)', isHealthy: false, severity: 'High' },
  { classId: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', crop: 'Grape', disease: 'Leaf blight', isHealthy: false, severity: 'Medium' },
  { classId: 'Grape___healthy', crop: 'Grape', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Orange___Haunglongbing_(Citrus_greening)', crop: 'Orange', disease: 'Citrus greening (Huanglongbing)', isHealthy: false, severity: 'High' },
  { classId: 'Peach___Bacterial_spot', crop: 'Peach', disease: 'Bacterial spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Peach___healthy', crop: 'Peach', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Pepper,_bell___Bacterial_spot', crop: 'Pepper', disease: 'Bacterial spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Pepper,_bell___healthy', crop: 'Pepper', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Potato___Early_blight', crop: 'Potato', disease: 'Early blight', isHealthy: false, severity: 'Medium' },
  { classId: 'Potato___Late_blight', crop: 'Potato', disease: 'Late blight', isHealthy: false, severity: 'High' },
  { classId: 'Potato___healthy', crop: 'Potato', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Raspberry___healthy', crop: 'Raspberry', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Soybean___healthy', crop: 'Soybean', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Squash___Powdery_mildew', crop: 'Squash', disease: 'Powdery mildew', isHealthy: false, severity: 'Low' },
  { classId: 'Strawberry___Leaf_scorch', crop: 'Strawberry', disease: 'Leaf scorch', isHealthy: false, severity: 'Medium' },
  { classId: 'Strawberry___healthy', crop: 'Strawberry', disease: 'Healthy', isHealthy: true, severity: 'None' },
  { classId: 'Tomato___Bacterial_spot', crop: 'Tomato', disease: 'Bacterial spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Tomato___Early_blight', crop: 'Tomato', disease: 'Early blight', isHealthy: false, severity: 'Medium' },
  { classId: 'Tomato___Late_blight', crop: 'Tomato', disease: 'Late blight', isHealthy: false, severity: 'High' },
  { classId: 'Tomato___Leaf_Mold', crop: 'Tomato', disease: 'Leaf Mold', isHealthy: false, severity: 'Low' },
  { classId: 'Tomato___Septoria_leaf_spot', crop: 'Tomato', disease: 'Septoria leaf spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Tomato___Spider_mites Two-spotted_spider_mite', crop: 'Tomato', disease: 'Spider mites', isHealthy: false, severity: 'Medium' },
  { classId: 'Tomato___Target_Spot', crop: 'Tomato', disease: 'Target Spot', isHealthy: false, severity: 'Medium' },
  { classId: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', crop: 'Tomato', disease: 'Tomato Yellow Leaf Curl Virus', isHealthy: false, severity: 'High' },
  { classId: 'Tomato___Tomato_mosaic_virus', crop: 'Tomato', disease: 'Mosaic virus', isHealthy: false, severity: 'High' },
  { classId: 'Tomato___healthy', crop: 'Tomato', disease: 'Healthy', isHealthy: true, severity: 'None' }
];

/**
 * Checks whether a crop name belongs to the 14 supported PlantVillage crops.
 */
export function isCropSupported(cropName) {
  if (!cropName || typeof cropName !== 'string') return false;
  const clean = cropName.toLowerCase();
  return SUPPORTED_CROPS.some(c => clean.includes(c.toLowerCase()));
}

/**
 * Evaluates prediction reliability according to strict safety rules:
 * - SUPPORTED / HIGH CONFIDENCE (confidence >= 75% AND margin >= 15%)
 * - SUPPORTED / LOW CONFIDENCE (50% <= confidence < 75% AND margin >= 12%)
 * - UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE (confidence < 50% OR margin < 12% OR unsupported crop)
 */
export function evaluateReliability({
  confidence = 0,
  crop = '',
  disease = '',
  topPredictions = [],
  isSupported = true
}) {
  const conf = Math.max(0, Math.min(100, Math.round(Number(confidence) || 0)));
  const supported = isSupported && isCropSupported(crop);

  // Ambiguity margin check
  let isAmbiguous = false;
  let margin = 100;
  if (Array.isArray(topPredictions) && topPredictions.length >= 2) {
    const p1 = Number(topPredictions[0]?.confidence) || conf;
    const p2 = Number(topPredictions[1]?.confidence) || 0;
    margin = Math.abs(p1 - p2);
    // If top 2 predictions are within 12% of each other, it's ambiguous
    if (margin < 12) {
      isAmbiguous = true;
    }
  }

  // Unsupported crop check
  if (!supported) {
    return {
      reliability: 'UNCERTAIN',
      reliabilityLabel: 'UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE',
      badgeClass: 'uncertain',
      isAmbiguous: true,
      margin,
      confidence: Math.min(conf, 48), // Cap confidence for unsupported crops
      warning: `This crop (${crop || 'Unknown'}) is outside the 14 trained PlantVillage crops. AI diagnosis cannot be verified with certainty.`
    };
  }

  // Ambiguous top predictions (e.g. 52% vs 44%)
  if (isAmbiguous) {
    return {
      reliability: 'UNCERTAIN',
      reliabilityLabel: 'UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE',
      badgeClass: 'uncertain',
      isAmbiguous: true,
      margin,
      confidence: conf,
      warning: `Ambiguous prediction: top candidates (${topPredictions[0]?.disease || disease} vs ${topPredictions[1]?.disease}) have close probabilities. Please retake a clearer photo.`
    };
  }

  // High Confidence: >= 75% with safe margin >= 15%
  if (conf >= 75 && margin >= 15) {
    return {
      reliability: 'HIGH_CONFIDENCE',
      reliabilityLabel: 'SUPPORTED / HIGH CONFIDENCE',
      badgeClass: 'high-confidence',
      isAmbiguous: false,
      margin,
      confidence: conf,
      warning: null
    };
  }

  // Low Confidence: 50% to 74%
  if (conf >= 50) {
    return {
      reliability: 'LOW_CONFIDENCE',
      reliabilityLabel: 'SUPPORTED / LOW CONFIDENCE',
      badgeClass: 'low-confidence',
      isAmbiguous: false,
      margin,
      confidence: conf,
      warning: 'Confidence is moderate. Inspect the plant closely and verify visible leaf symptoms.'
    };
  }

  // Below 50%
  return {
    reliability: 'UNCERTAIN',
    reliabilityLabel: 'UNCERTAIN — RETAKE OR UPLOAD A CLEARER IMAGE',
    badgeClass: 'uncertain',
    isAmbiguous: false,
    margin,
    confidence: conf,
    warning: 'Low model confidence. Please capture a closer, clearer photo under natural lighting.'
  };
}
