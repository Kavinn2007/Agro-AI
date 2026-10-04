/**
 * AgroAI High-Fidelity Image Pipeline
 * Preserves high resolution (up to 4K / 3840px) without unnecessary downscaling or false upscaling.
 */
export async function processImage(source) {
  return new Promise((resolve, reject) => {
    try {
      if (!source) {
        return reject(new Error("Invalid image source"));
      }

      // 1. Direct Data URL String
      if (typeof source === 'string') {
        if (!source.startsWith('data:image/') && !source.startsWith('blob:') && !source.startsWith('http') && !source.startsWith('/')) {
          return reject(new Error("Unsupported image format"));
        }
        return resolve(source);
      }

      // 2. File or Blob (Upload / Native Capture)
      if (source instanceof File || source instanceof Blob) {
        if (source.size === 0) {
          return reject(new Error("Image file is empty"));
        }

        // Validate accepted mime types (JPG, JPEG, PNG, WebP)
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (source.type && !validTypes.includes(source.type.toLowerCase())) {
          return reject(new Error("Please upload a JPG, PNG, or WebP image"));
        }

        const objectUrl = URL.createObjectURL(source);
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            return reject(new Error("Unable to determine image dimensions"));
          }

          // Preserve high resolution up to 4K UHD (3840px max edge to avoid mobile canvas memory crashes)
          // NEVER upscale lower resolution images.
          const MAX_DIMENSION = 3840;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
          
          if (!ctx) {
            return reject(new Error("Canvas context creation failed"));
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Preserve high quality: 0.92 JPEG gives visually lossless quality
          const outputDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          resolve(outputDataUrl);
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image file"));
        };

        img.src = objectUrl;
        return;
      }

      // 3. HTMLVideoElement (Live Camera Viewfinder)
      if (source instanceof HTMLVideoElement) {
        if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
          return reject(new Error("Camera feed is not ready"));
        }

        const width = source.videoWidth;
        const height = source.videoHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

        if (!ctx) {
          return reject(new Error("Canvas context creation failed"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, 0, 0, width, height);

        // Dark/Black frame check
        const frameSample = ctx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100)).data;
        let isBlack = true;
        for (let i = 0; i < frameSample.length; i += 16) {
          if (frameSample[i] > 15 || frameSample[i + 1] > 15 || frameSample[i + 2] > 15) {
            isBlack = false;
            break;
          }
        }

        if (isBlack) {
          return reject(new Error("Captured frame is too dark or invalid. Please check lighting."));
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95));
        return;
      }

      // 4. HTMLCanvasElement
      if (source instanceof HTMLCanvasElement) {
        resolve(source.toDataURL('image/jpeg', 0.95));
        return;
      }

      reject(new Error("Unsupported source type"));
    } catch (err) {
      reject(new Error(err.message || "Image processing failed"));
    }
  });
}
