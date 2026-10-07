/**
 * AgroAI Image Usability & Quality Checker
 * 
 * Verifies that an image is suitable for reliable neural disease detection:
 * - Adequate resolution (not a tiny icon or pixelated thumbnail)
 * - Balanced luminance (not pitch black or completely washed out)
 * - Sharp focus (flags severely blurred or out-of-focus images)
 * - Detectable plant / leaf region (rejects unrelated objects like cars, walls, faces, plain white screen)
 */

export async function checkImageQuality(imageSource, mode = 'plant') {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 1. Resolution Check
      if (width < 120 || height < 120 || (width * height < 25000)) {
        return resolve({
          isUsable: false,
          isValidCrop: false,
          reason: 'low_resolution',
          message: 'Image quality is too low for reliable analysis.',
          subMessage: 'Please capture a clearer photo.',
          guidance: 'Image resolution is too low. Capture or upload a photo with at least 250×250 pixels.'
        });
      }

      // Render onto an optimized canvas for quality profiling
      const sampleWidth = Math.min(width, 240);
      const sampleHeight = Math.min(height, 240);
      const canvas = document.createElement('canvas');
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        return resolve({ isUsable: true, isValidCrop: true });
      }

      ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
      const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = imgData.data;
      const totalPixels = sampleWidth * sampleHeight;

      let sumLuminance = 0;
      let clippedBrightPixels = 0;
      let plantPixels = 0;
      let soilPixels = 0;
      let nonUniformPixels = 0;

      // Grayscale array for blur (Laplacian variance) analysis
      const gray = new Float32Array(totalPixels);

      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard ITU-R BT.601 luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        gray[p] = lum;
        sumLuminance += lum;

        if (lum > 245) clippedBrightPixels++;

        // Exclude monochromatic neutral gray background
        const isNeutral = Math.abs(r - g) < 12 && Math.abs(g - b) < 12;
        if (!isNeutral) nonUniformPixels++;

        // Plant tissue signature:
        // Healthy green, chlorotic yellow, or diseased lesions/blight spots
        const isGreen = g > r + 10 && g > b + 10;
        const isYellow = r > 115 && g > 115 && b < 105 && Math.abs(r - g) < 45;
        const isLesionBrown = (r > 70 && g < 135 && b < 110 && r > g) || 
                              (r < 80 && g < 80 && b < 80 && (r > 20 || g > 20 || b > 20));

        if (isGreen || isYellow || isLesionBrown) {
          plantPixels++;
        }

        // Soil texture signature
        const isSoilColor = (r > g && g > b && r < 200 && r > 40) ||
                            (r > 110 && g > 110 && b > 75 && Math.abs(r - g) < 35);
        if (isSoilColor) {
          soilPixels++;
        }
      }

      const avgLuminance = sumLuminance / totalPixels;

      // 2. Extremely Dark / Underexposed Check
      if (avgLuminance < 24) {
        return resolve({
          isUsable: false,
          isValidCrop: false,
          reason: 'extremely_dark',
          message: 'Image quality is too low for reliable analysis.',
          subMessage: 'Please capture a clearer photo.',
          guidance: 'The image is too dark for feature detection. Provide adequate ambient light.'
        });
      }

      // 3. Extremely Bright / Overexposed Check
      if (avgLuminance > 236 || (clippedBrightPixels / totalPixels > 0.65)) {
        return resolve({
          isUsable: false,
          isValidCrop: false,
          reason: 'extremely_bright',
          message: 'Image quality is too low for reliable analysis.',
          subMessage: 'Please capture a clearer photo.',
          guidance: 'The image is washed out or overexposed. Avoid direct lens glare.'
        });
      }

      // 4. Severe Blur / Out-of-Focus Check (Laplacian edge variance)
      let laplacianSum = 0;
      let laplacianSumSq = 0;
      let validEdgeCount = 0;

      for (let y = 1; y < sampleHeight - 1; y++) {
        for (let x = 1; x < sampleWidth - 1; x++) {
          const idx = y * sampleWidth + x;
          // 4-neighbor discrete Laplacian kernel: [0, 1, 0; 1, -4, 1; 0, 1, 0]
          const lap = Math.abs(
            4 * gray[idx] -
            gray[idx - 1] -
            gray[idx + 1] -
            gray[idx - sampleWidth] -
            gray[idx + sampleWidth]
          );
          laplacianSum += lap;
          laplacianSumSq += lap * lap;
          validEdgeCount++;
        }
      }

      const meanLap = laplacianSum / validEdgeCount;
      const lapVariance = (laplacianSumSq / validEdgeCount) - (meanLap * meanLap);

      // If the scene is not purely flat color and edge variance is very low, it's severely blurred
      if (lapVariance < 16 && nonUniformPixels > (totalPixels * 0.15)) {
        return resolve({
          isUsable: false,
          isValidCrop: false,
          reason: 'severely_blurred',
          message: 'Image quality is too low for reliable analysis.',
          subMessage: 'Please capture a clearer photo.',
          guidance: 'The image is severely blurry. Hold camera steady and focus directly on the leaf.'
        });
      }

      // 5. Detectable Plant / Leaf Region Check
      if (mode === 'plant') {
        const plantRatio = plantPixels / totalPixels;
        // At least 7% of sampled pixels must exhibit plant tissue characteristics
        if (plantRatio < 0.07) {
          return resolve({
            isUsable: false,
            isValidCrop: false,
            reason: 'no_plant_detected',
            message: 'Image quality is too low for reliable analysis.',
            subMessage: 'Please capture a clearer photo.',
            guidance: 'No recognizable plant or leaf detected in this photo. Please photograph a crop leaf directly.'
          });
        }
      } else if (mode === 'soil') {
        const soilRatio = soilPixels / totalPixels;
        if (soilRatio < 0.08) {
          return resolve({
            isUsable: false,
            isValidCrop: false,
            reason: 'no_soil_detected',
            message: 'Image quality is too low for reliable analysis.',
            subMessage: 'Please capture a clearer photo.',
            guidance: 'No recognizable soil sample detected in this photo.'
          });
        }
      }

      // All quality and viability checks passed
      resolve({
        isUsable: true,
        isValidCrop: true,
        metrics: {
          avgLuminance: Math.round(avgLuminance),
          blurVariance: Math.round(lapVariance),
          plantRatio: Math.round((plantPixels / totalPixels) * 100)
        }
      });
    };

    img.onerror = () => {
      resolve({
        isUsable: false,
        isValidCrop: false,
        reason: 'load_error',
        message: 'Image quality is too low for reliable analysis.',
        subMessage: 'Please capture a clearer photo.',
        guidance: 'Unable to load image file. Please provide a standard JPG, PNG, or WebP photo.'
      });
    };

    img.src = imageSource;
  });
}
