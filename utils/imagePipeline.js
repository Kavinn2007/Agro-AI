export async function processImage(source) {
  return new Promise((resolve, reject) => {
    try {
      if (!source) {
        return reject(new Error("Invalid image"));
      }

      // Handle File (Upload)
      if (source instanceof File || source instanceof Blob) {
        if (source.size === 0) {
          return reject(new Error("Invalid image"));
        }
        const img = new Image();
        const objectUrl = URL.createObjectURL(source);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions logic to prevent API 413 Payload Too Large
          const MAX_SIZE = 1080;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error("Invalid image"));
        img.src = objectUrl;
        return;
      }

      // Handle Canvas or Video
      let canvas = source;
      if (source instanceof HTMLVideoElement) {
        if (source.readyState !== 4 || source.videoWidth === 0) {
          return reject(new Error("Camera not ready"));
        }
        canvas = document.createElement('canvas');
        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      }

      if (canvas instanceof HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        // Check for black frame
        let isBlack = true;
        for (let i = 0; i < frameData.length; i += 40) {
          if (frameData[i] > 10 || frameData[i+1] > 10 || frameData[i+2] > 10) {
            isBlack = false;
            break;
          }
        }

        if (isBlack) {
          return reject(new Error("Camera not ready or image too dark"));
        }

        // Return base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } else {
        reject(new Error("Invalid image source"));
      }

    } catch (err) {
      reject(new Error("Invalid image"));
    }
  });
}
