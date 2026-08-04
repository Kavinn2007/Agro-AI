function evaluateColor(r, g, b) {
  // Plant Logic
  if (g > r + 30 && g > b + 30) return 'green'; // Healthy
  if (r > 150 && g > 150 && b < 100) return 'yellow'; // Deficiency
  if (r > 100 && g < 100 && b < 100) return 'spots'; // Disease (Spots)
  return 'unknown';
}

function analyzeSoilColor(r, g, b) {
  // Soil Logic
  const brightness = (r + g + b) / 3;
  if (brightness > 140) return 'Sandy'; // Light
  if (brightness < 80) return 'Clay';   // Dark
  return 'Loamy';                       // Mixed
}

export async function validateInput(imageUrl, mode) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const allImageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let greenPixels = 0;
      let brownOrSoilPixels = 0;

      let sampledCount = 0;
      for (let i = 0; i < allImageData.length; i += 16) {
        let r = allImageData[i];
        let g = allImageData[i+1];
        let b = allImageData[i+2];
        sampledCount++;

        // Green plant layout & shape check abstract
        if (g > r + 10 && g > b + 10) {
          greenPixels++;
        }

        // Soil texture/brownish color
        if ((r > g && g > b && r < 200 && r > 40) ||
            (r > 120 && g > 120 && b > 80 && Math.abs(r-g) < 30) ||
            (r < 80 && g < 80 && b < 80)) {
           brownOrSoilPixels++;
        }
      }

      const invalidPayload = {
        isValidCrop: false,
        isSoil: false,
        type: 'invalid',
        message: 'Invalid input. Please show plant or soil clearly',
        disease: 'Detection failed'
      };

      if (mode === 'plant') {
        if (greenPixels / sampledCount >= 0.10) {
          resolve({ isValidCrop: true });
        } else {
          resolve(invalidPayload);
        }
      } else {
        if (brownOrSoilPixels / sampledCount >= 0.10) {
          resolve({ isValidCrop: true, isSoil: true });
        } else {
          resolve(invalidPayload);
        }
      }
    };
    img.onerror = () => {
      resolve({
        isValidCrop: false,
        isSoil: false,
        type: 'invalid',
        message: 'Invalid input. Please show plant or soil clearly',
        disease: 'Detection failed'
      });
    };
    img.src = imageUrl;
  });
}

export async function processLocally(imageUrl, language, mode) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      if (mode === 'plant') {
        let greenCount = 0;
        let yellowCount = 0;
        let spotsCount = 0;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Pixel-by-pixel sampling for much higher accuracy
        for (let i = 0; i < imageData.length; i += 16) {
           let r = imageData[i];
           let g = imageData[i+1];
           let b = imageData[i+2];

           // Exclude background (pure white, pure black, gray)
           if (Math.abs(r-g) < 15 && Math.abs(g-b) < 15) continue;

           if (g > r + 15 && g > b + 15) {
               greenCount++; // Healthy green tissue
           } else if (r > 130 && g > 130 && b < 100) {
               yellowCount++; // Yellowing/Chlorosis
           } else if (
               (r > 70 && g < 130 && b < 100 && r > g) || // Brown/red/orange spots
               (r < 80 && g < 80 && b < 80 && (r > 20 || g > 20 || b > 20)) // Dark rot/black spots
           ) {
               spotsCount++;
           }
        }

        let diseaseTypes = new Set();
        let remedies = new Set();
        
        const totalPlantPixels = greenCount + yellowCount + spotsCount;
        // If we found plant pixels, do proportional check
        if (totalPlantPixels > 0) {
           // Even 4% of spots means diseased
           if (spotsCount > totalPlantPixels * 0.04) {
               diseaseTypes.add('Leaf Spots / Blight');
               remedies.add('Apply appropriate fungicide, prune affected leaves');
           }
           // 15% yellowing means deficiency
           if (yellowCount > totalPlantPixels * 0.15) {
               diseaseTypes.add('Nutrient Deficiency (Yellowing)');
               remedies.add('Apply nitrogen/iron balanced fertilizer');
           }
        } else {
           // Fallback if no specific plant traits found clearly
           if (evaluateColor(100, 150, 50) === 'green') {
               // generic fallback
           }
        }

        let isHealthy = diseaseTypes.size === 0;
        let diseaseStr = isHealthy ? 'Healthy' : Array.from(diseaseTypes).join(', ');
        let remedyStr = isHealthy ? 'Ensure proper watering and sunlight' : Array.from(remedies).join('. ');
        let symptomsStr = isHealthy ? 'Green healthy foliage detected.' : `Signs of disease detected: ${diseaseStr}.`;

        resolve({
          isValidCrop: true,
          isSoil: false,
          multiLeaf: false,
          crop: 'Unknown Crop (Offline Mode)',
          disease: diseaseStr,
          severity: isHealthy ? 'Healthy' : (spotsCount > totalPlantPixels * 0.15 ? 'High' : 'Medium'),
          symptoms: symptomsStr,
          remedy: remedyStr,
          prevention: 'Maintain balanced soil nutrients, proper watering, and good airflow.',
          confidence: 65,
          soilType: '',
          characteristics: '',
          suitableCrops: '',
          waterRequirement: '',
          fertilizerSuggestions: '',
          isLocal: true,
          healthyCrops: isHealthy,
          diseasedCrops: !isHealthy
        });

      } else {
        // Soil Mode
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < imageData.length; i += 16) {
          rSum += imageData[i];
          gSum += imageData[i+1];
          bSum += imageData[i+2];
          count++;
        }
        const soilType = analyzeSoilColor(rSum/count, gSum/count, bSum/count);
        
        resolve({
          isValidCrop: true,
          isSoil: true,
          multiLeaf: false,
          crop: 'N/A',
          disease: 'Healthy',
          severity: 'Low',
          symptoms: 'Soil detected successfully.',
          remedy: 'N/A',
          prevention: 'N/A',
          confidence: 75,
          soilType: `${soilType} Soil`,
          characteristics: `Typical of ${soilType} soil.`,
          suitableCrops: soilType === 'Sandy' ? 'Potatoes, Carrots' : soilType === 'Clay' ? 'Rice, Broccoli' : 'Wheat, Cotton',
          waterRequirement: soilType === 'Sandy' ? 'High' : soilType === 'Clay' ? 'Low' : 'Medium',
          fertilizerSuggestions: 'Balance NPK based on target crop',
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
        symptoms: 'Image could not be reliably processed.',
        remedy: '',
        confidence: 0
      });
    };
    img.src = imageUrl;
  });
}
