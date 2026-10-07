const AI_API_KEY = import.meta.env.VITE_AI_API_KEY;
import { processLocally } from './localAnalysis';
import { checkImageQuality } from '../utils/imageQuality';
import { evaluateReliability, SUPPORTED_CROPS } from '../utils/supportedClasses';

let lastApiCallTime = 0;

export async function analyzeImage(imageUrl, language = 'en', mode = 'plant') {
  // 1. Mandatory Pre-Inference Image Quality Check
  const quality = await checkImageQuality(imageUrl, mode);
  if (!quality.isUsable) {
    return {
      isValidCrop: false,
      isQualityIssue: true,
      reason: quality.reason,
      message: quality.message || 'Image quality is too low for reliable analysis.',
      subMessage: quality.subMessage || 'Please capture a clearer photo.',
      guidance: quality.guidance || 'Please provide a clear crop leaf photo.',
      disease: 'Detection failed',
      confidence: 0
    };
  }

  // 2. Use local fallback immediately if no valid Gemini key provided
  if (!AI_API_KEY || AI_API_KEY === 'your_grok_api_key_here' || AI_API_KEY === 'your_groq_api_key_here') {
    return processLocally(imageUrl, language, mode);
  }

  // 3. Rate limiting helper (avoid rapid bursts)
  const now = Date.now();
  if (now - lastApiCallTime < 4500) {
    console.log("Using offline analysis mode due to rate limiting");
    return processLocally(imageUrl, language, mode);
  }
  
  lastApiCallTime = now;

  const languageNames = {
    'en': 'English',
    'ta': 'Tamil',
    'hi': 'Hindi',
    'te': 'Telugu',
    'kn': 'Kannada',
    'ml': 'Malayalam'
  };
  const targetLanguage = languageNames[language] || 'English';

  const systemInstruction = `You are an expert agricultural AI specializing in reliable, safe plant disease identification.

IMPORTANT SCOPE & RELIABILITY RULES:
The AgroAI model is trained on the 38 PlantVillage classes covering exactly these 14 crops:
${SUPPORTED_CROPS.join(', ')}.

DO NOT claim universal plant recognition or certainty for crops outside this list.
DO NOT use exaggerated certainty numbers such as 100% or 99%.
DO NOT claim "guaranteed diagnosis" or "definitely correct".

INSPECTION PROCEDURE:
1. Examine visible symptoms only: leaf spots, chlorosis (yellowing), necrosis, blight lesions, rust pustules, powdery mildew, curling, or healthy green foliage.
2. Determine if the crop is in the 14 supported crops: ${SUPPORTED_CROPS.join(', ')}.
   - If YES, match to the closest condition among the 38 PlantVillage classes.
   - If NO, specify the crop name honestly, set "isSupportedCrop": false, and assign a conservative confidence (<= 45%).
3. Calculate TOP PREDICTIONS (top 2 or 3 candidates with respective percentage estimates summing realistically).
   - If top 1 and top 2 are close in confidence (margin < 15%), mark "isAmbiguous": true.
4. Output state must be one of:
   - "HIGH_CONFIDENCE" (supported crop, confidence >= 75%, clear unambiguous symptoms)
   - "LOW_CONFIDENCE" (supported crop, confidence 50-74%, or moderate symptoms)
   - "UNCERTAIN" (unsupported crop, or confidence < 50%, or ambiguous candidates)

Respond strictly with VALID JSON matching this structure:
{
  "isValidCrop": true,
  "isSoil": false,
  "multiLeaf": false,
  "crop": "Crop Name",
  "disease": "Disease Name or 'Healthy'",
  "isSupportedCrop": true,
  "severity": "Low/Medium/High or 'Healthy'",
  "symptoms": "Detailed objective visual observations",
  "remedy": "Actionable agronomic treatment",
  "prevention": "Practical preventative care",
  "confidence": 78,
  "topPredictions": [
    { "crop": "Crop Name", "disease": "Primary Condition", "confidence": 78 },
    { "crop": "Crop Name", "disease": "Alternative Condition", "confidence": 18 }
  ],
  "isAmbiguous": false,
  "soilType": "",
  "characteristics": "",
  "suitableCrops": "",
  "waterRequirement": "",
  "fertilizerSuggestions": ""
}
Ensure the values are translated into ${targetLanguage}.`;

  try {
    let base64Image = imageUrl;
    if (imageUrl.startsWith('blob:')) {
      base64Image = await blobUrlToBase64(imageUrl);
    }
    
    // Remove prefix if exists
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

    // Call Gemini Vision REST API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemInstruction },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
           response_mime_type: "application/json",
        }
      })
    });

    if (!response.ok) {
      console.warn(`AI API Failed with status ${response.status}. Using local fallback.`);
      return processLocally(imageUrl, language, mode);
    }

    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.warn('No response from AI, switching to local logic.');
      return processLocally(imageUrl, language, mode);
    }

    // Parse JSON output
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1].trim());
    } catch(e) {
      try {
        result = JSON.parse(content.trim());
      } catch(err) {
        result = {};
      }
    }

    const cropName = result.crop || 'Unknown Crop';
    const diseaseName = result.disease || 'Healthy';
    const rawConf = Number(result.confidence) || 75;
    const topPreds = Array.isArray(result.topPredictions) && result.topPredictions.length > 0 
      ? result.topPredictions 
      : [{ crop: cropName, disease: diseaseName, confidence: rawConf }];

    // Enforce rigorous safety & reliability evaluation
    const reliabilityEval = evaluateReliability({
      confidence: rawConf,
      crop: cropName,
      disease: diseaseName,
      topPredictions: topPreds,
      isSupported: result.isSupportedCrop !== false
    });

    return {
      isValidCrop: typeof result.isValidCrop === 'boolean' ? result.isValidCrop : true,
      isSoil: !!result.isSoil,
      multiLeaf: !!result.multiLeaf,
      crop: cropName,
      disease: diseaseName,
      severity: result.severity || 'Medium',
      symptoms: result.symptoms || 'Visual examination complete.',
      remedy: result.remedy || 'Consult a certified local agricultural extension officer.',
      prevention: result.prevention || 'Maintain good field sanitation, optimal spacing, and balanced irrigation.',
      confidence: reliabilityEval.confidence,
      reliability: reliabilityEval.reliability,
      reliabilityLabel: reliabilityEval.reliabilityLabel,
      badgeClass: reliabilityEval.badgeClass,
      isAmbiguous: reliabilityEval.isAmbiguous,
      uncertaintyReason: reliabilityEval.warning,
      topPredictions: topPreds,
      isSupportedCrop: result.isSupportedCrop !== false,
      soilType: result.soilType || '',
      characteristics: result.characteristics || '',
      suitableCrops: result.suitableCrops || '',
      waterRequirement: result.waterRequirement || '',
      fertilizerSuggestions: result.fertilizerSuggestions || '',
      isLocal: false
    };

  } catch (error) {
    console.warn(`AI API Exception: ${error.message}. Using offline logic.`);
    return processLocally(imageUrl, language, mode);
  }
}

async function blobUrlToBase64(blobUrl) {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
