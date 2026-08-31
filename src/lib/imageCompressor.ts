/**
 * Utility to resize and compress client-side images before saving to Firestore.
 * Ensures image payloads stay well below the 1MB (1,048,576 bytes) Firestore document limit.
 */

export interface CompressionOptions {
  maxDimension?: number;
  initialQuality?: number;
  maxSizeBytes?: number; // target max size per image (e.g., 90KB)
}

/**
 * Resizes and compresses an image (File or base64 string) using HTML Canvas.
 */
export async function compressImage(
  input: File | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxDimension = 1000,
    initialQuality = 0.78,
    maxSizeBytes = 95 * 1024 // ~95 KB per image ensures multiple images fit in 1MB document
  } = options;

  // If it's already an external HTTP/HTTPS URL, don't recompress
  if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://'))) {
    return input;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate aspect ratio scaled dimensions
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }

        // Draw image with nice smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively find right compression level
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Approximate byte size: (base64 length * 3) / 4
        let approximateBytes = (dataUrl.length * 3) / 4;

        if (approximateBytes > maxSizeBytes) {
          quality = 0.65;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          approximateBytes = (dataUrl.length * 3) / 4;
        }

        if (approximateBytes > maxSizeBytes) {
          quality = 0.52;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          approximateBytes = (dataUrl.length * 3) / 4;
        }

        if (approximateBytes > maxSizeBytes) {
          // Downscale canvas further
          const halfCanvas = document.createElement('canvas');
          halfCanvas.width = Math.round(width * 0.75);
          halfCanvas.height = Math.round(height * 0.75);
          const halfCtx = halfCanvas.getContext('2d');
          if (halfCtx) {
            halfCtx.drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
            dataUrl = halfCanvas.toDataURL('image/jpeg', 0.5);
          }
        }

        resolve(dataUrl);
      } catch (err) {
        console.error('Image compression error:', err);
        // Fallback to original
        if (typeof input === 'string') {
          resolve(input);
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(input);
        }
      }
    };

    img.onerror = (err) => {
      console.warn('Image load error during compression:', err);
      if (typeof input === 'string') {
        resolve(input);
      } else {
        reject(new Error('Görsel okunamadı'));
      }
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Compresses an array of Files or URLs concurrently
 */
export async function compressImageFiles(files: FileList | File[]): Promise<string[]> {
  const fileArray = Array.from(files);
  const compressionPromises = fileArray.map(file => compressImage(file));
  return Promise.all(compressionPromises);
}

/**
 * Optimizes an existing list of image URLs/data URLs to ensure none exceed safe byte limits
 */
export async function optimizeImageList(images: string[]): Promise<string[]> {
  const promises = images.map(async (img) => {
    if (img.startsWith('data:image')) {
      return compressImage(img);
    }
    return img;
  });
  return Promise.all(promises);
}

/**
 * Calculates estimated JSON payload byte size
 */
export function estimatePayloadSize(payload: unknown): number {
  try {
    const jsonString = JSON.stringify(payload);
    return new Blob([jsonString]).size;
  } catch {
    return 0;
  }
}
