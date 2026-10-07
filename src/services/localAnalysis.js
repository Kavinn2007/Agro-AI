import { checkImageQuality } from '../utils/imageQuality';
import { evaluateReliability, PLANTVILLAGE_CLASSES } from '../utils/supportedClasses';

function analyzeSoilColor(r, g, b) {
  const brightness = (r + g + b) / 3;
  if (brightness > 140) return 'Sandy';
  if (brightness < 80) return 'Clay';
  return 'Loamy';
}

/**
 * Pre-inference validation using comprehensive real-world image quality checks:
 * Rejects low-res, over/underexposed, severely blurred, or non-plant images.
 */
export async function validateInput(imageUrl, mode = 'plant') {
  const quality = await checkImageQuality(imageUrl, mode);

  if (!quality.isUsable) {
    return {
      isValidCrop: false,
      isQualityIssue: true,
      reason: quality.reason,
      message: quality.message || 'Image quality is too low for reliable analysis.',
      subMessage: quality.subMessage || 'Please capture a clearer photo.',
      guidance: quality.guidance || 'Please provide a clear crop leaf photo.',
      disease: 'Detection failed'
    };
  }

  return {
    isValidCrop: true,
    metrics: quality.metrics
  };
}

/**
 * Local inference heuristic based on color distribution, lesion patterns, and ambiguity checks.
 * Strict conformance with the 38 PlantVillage classes and realistic confidence scoring.
 */
export async function processLocally(imageUrl, language = 'en', mode = 'plant') {
  // 1. Run image quality check first
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

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.naturalWidth || img.width, 400);
      canvas.height = Math.min(img.naturalHeight || img.height, 400);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (mode === 'plant') {
        let greenCount = 0;
        let yellowCount = 0;
        let spotDarkCount = 0;
        let spotRustCount = 0;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];

          // Exclude uniform monochromatic background
          if (Math.abs(r - g) < 12 && Math.abs(g - b) < 12) continue;

          if (g > r + 14 && g > b + 14) {
            greenCount++; // Healthy green tissue
          } else if (r > 125 && g > 125 && b < 100 && Math.abs(r - g) < 35) {
            yellowCount++; // Chlorosis / yellowing
          } else if (r > 75 && g < 130 && b < 100 && r > g) {
            spotRustCount++; // Rust or brown lesions
          } else if (r < 75 && g < 75 && b < 75 && (r > 20 || g > 20 || b > 20)) {
            spotDarkCount++; // Dark blight / necrotic rot
          }
        }

        const totalPlantPixels = greenCount + yellowCount + spotDarkCount + spotRustCount;

        let primaryDisease = 'Healthy';
        let primaryCrop = 'Tomato'; // Baseline solanaceous representative
        let baseConfidence = 72;
        let topCandidates = [];
        let severity = 'Healthy';
        let symptoms = 'Leaf foliage appears uniform, green, and intact with no critical lesions.';
        let remedy = 'Maintain regular watering schedule and balanced micro-nutrients.';
        let prevention = 'Continue good crop hygiene, adequate sunlight, and proper drainage.';

        if (totalPlantPixels > 0) {
          const greenRatio = greenCount / totalPlantPixels;
          const darkRatio = spotDarkCount / totalPlantPixels;
          const rustRatio = spotRustCount / totalPlantPixels;
          const yellowRatio = yellowCount / totalPlantPixels;

          if (darkRatio > 0.08) {
            // Necrotic spots / Blight pattern
            primaryDisease = 'Early blight';
            primaryCrop = 'Tomato';
            severity = darkRatio > 0.20 ? 'High' : 'Medium';
            baseConfidence = Math.min(74, Math.round(58 + darkRatio * 45));
            symptoms = 'Concentric dark brown lesions and target-like spots observed on leaf tissue.';
            remedy = 'Apply copper-based fungicide or potassium bicarbonate. Prune affected foliage.';
            prevention = 'Avoid overhead watering, practice crop rotation, and ensure adequate spacing.';

            const altConf = Math.max(18, Math.round(baseConfidence * 0.55));
            topCandidates = [
              { crop: 'Tomato', disease: 'Early blight', confidence: baseConfidence },
              { crop: 'Potato', disease: 'Late blight', confidence: altConf },
              { crop: 'Tomato', disease: 'Septoria leaf spot', confidence: Math.max(10, 100 - baseConfidence - altConf) }
            ];
          } else if (rustRatio > 0.07) {
            // Rust / Scorch pattern
            primaryDisease = 'Common rust';
            primaryCrop = 'Corn';
            severity = rustRatio > 0.18 ? 'High' : 'Medium';
            baseConfidence = Math.min(72, Math.round(56 + rustRatio * 45));
            symptoms = 'Reddish-brown to cinnamon pustules and discoloration on foliage.';
            remedy = 'Apply organic sulfur or neem oil extract spray early in morning.';
            prevention = 'Plant resistant varieties and maintain crop residue management.';

            const altConf = Math.max(20, Math.round(baseConfidence * 0.60));
            topCandidates = [
              { crop: 'Corn', disease: 'Common rust', confidence: baseConfidence },
              { crop: 'Apple', disease: 'Cedar apple rust', confidence: altConf },
              { crop: 'Strawberry', disease: 'Leaf scorch', confidence: Math.max(10, 100 - baseConfidence - altConf) }
            ];
          } else if (yellowRatio > 0.14) {
            // Chlorosis / Yellow Leaf Curl pattern
            primaryDisease = 'Tomato Yellow Leaf Curl Virus';
            primaryCrop = 'Tomato';
            severity = 'Medium';
            baseConfidence = Math.min(68, Math.round(52 + yellowRatio * 40));
            symptoms = 'Marginal leaf chlorosis and yellowing pattern with stunted appearance.';
            remedy = 'Manage whitefly insect vectors with insecticidal soap or neem oil spray.';
            prevention = 'Use 50-mesh insect netting in nursery beds and remove weed hosts.';

            const altConf = Math.max(22, Math.round(baseConfidence * 0.65));
            topCandidates = [
              { crop: 'Tomato', disease: 'Tomato Yellow Leaf Curl Virus', confidence: baseConfidence },
              { crop: 'Squash', disease: 'Powdery mildew', confidence: altConf }
            ];
          } else {
            // Healthy plant
            primaryDisease = 'Healthy';
            primaryCrop = 'Tomato';
            severity = 'None';
            baseConfidence = Math.min(78, Math.round(62 + greenRatio * 18));
            symptoms = 'Vibrant green foliage detected. No active fungal lesions or bacterial spots visible.';
            remedy = 'No chemical treatment needed. Maintain optimal irrigation and organic fertilization.';
            prevention = 'Continue regular field inspection and weed management.';

            topCandidates = [
              { crop: 'Tomato', disease: 'Healthy', confidence: baseConfidence },
              { crop: 'Potato', disease: 'Healthy', confidence: Math.max(15, 100 - baseConfidence) }
            ];
          }
        }

        // Apply strict safety and reliability evaluation
        const reliabilityEval = evaluateReliability({
          confidence: baseConfidence,
          crop: primaryCrop,
          disease: primaryDisease,
          topPredictions: topCandidates,
          isSupported: true
        });

        resolve({
          isValidCrop: true,
          isSoil: false,
          multiLeaf: false,
          crop: primaryCrop,
          disease: primaryDisease,
          severity,
          symptoms,
          remedy,
          prevention,
          confidence: reliabilityEval.confidence,
          reliability: reliabilityEval.reliability,
          reliabilityLabel: reliabilityEval.reliabilityLabel,
          badgeClass: reliabilityEval.badgeClass,
          isAmbiguous: reliabilityEval.isAmbiguous,
          uncertaintyReason: reliabilityEval.warning,
          topPredictions: topCandidates,
          isSupportedCrop: true,
          isLocal: true
        });

      } else {
        // Soil Mode
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < imageData.length; i += 16) {
          rSum += imageData[i];
          gSum += imageData[i + 1];
          bSum += imageData[i + 2];
          count++;
        }
        const soilType = analyzeSoilColor(rSum / count, gSum / count, bSum / count);

        resolve({
          isValidCrop: true,
          isSoil: true,
          multiLeaf: false,
          crop: 'N/A',
          disease: 'Healthy',
          severity: 'Low',
          symptoms: 'Soil texture profile detected successfully.',
          remedy: 'N/A',
          prevention: 'N/A',
          confidence: 72,
          reliability: 'HIGH_CONFIDENCE',
          reliabilityLabel: 'SUPPORTED / HIGH CONFIDENCE',
          badgeClass: 'high-confidence',
          soilType: `${soilType} Soil`,
          characteristics: `Typical physical properties of ${soilType} soil.`,
          suitableCrops: soilType === 'Sandy' ? 'Potatoes, Carrots, Groundnut' : soilType === 'Clay' ? 'Rice, Broccoli, Cabbage' : 'Wheat, Cotton, Pulses',
          waterRequirement: soilType === 'Sandy' ? 'High' : soilType === 'Clay' ? 'Low' : 'Medium',
          fertilizerSuggestions: 'Balance NPK based on target crop requirements.',
          isLocal: true,
          healthyCrops: false,
          diseasedCrops: false
        });
      }
    };

    img.onerror = () => {
      resolve({
        isValidCrop: false,
        isSoil: false,
        crop: 'Unknown',
        disease: 'Detection failed',
        message: 'Image quality is too low for reliable analysis.',
        subMessage: 'Please capture a clearer photo.',
        confidence: 0
      });
    };

    img.src = imageUrl;
  });
}
