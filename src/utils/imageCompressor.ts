/**
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automagically resizes and compresses bitmap images using an offscreen HTML Canvas
 * to fit nicely within standard database sizes (usually <1MB), preserving aspect ratio.
 */
export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if the browser actually supports FileReader & Canvas
    if (typeof window === "undefined" || !window.FileReader || !window.HTMLCanvasElement) {
      reject(new Error("Unsupported environment for client-side compression."));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        let width = image.width;
        let height = image.height;

        // Apply aspect-ratio-friendly container resizing bounds
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas device context."));
          return;
        }

        // Draw image keeping original look & color profiles
        ctx.fillStyle = "#000000"; // Black background for transparency support in JPG
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0, width, height);

        try {
          // Downsample using progressive JPEG which is optimized for web
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (e) {
          reject(e);
        }
      };

      image.onerror = (err) => {
        reject(new Error("Invalid image format or corrupted asset."));
      };

      if (readerEvent.target?.result) {
        image.src = readerEvent.target.result as string;
      } else {
        reject(new Error("Failed to read sample payload."));
      }
    };

    reader.onerror = () => {
      reject(new Error("FileReader error reading file structure."));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Creates a cropped image canvas slice and compresses it to base64.
 */
export const getCroppedImg = (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (imageSrc && !imageSrc.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      
      // Limit resolution to under 900px width/height for maximum rendering performance & light DB payloads (~60KB to ~150KB space)
      const targetWidth = Math.min(pixelCrop.width, 900);
      const targetHeight = Math.round((pixelCrop.height * targetWidth) / pixelCrop.width);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No 2D canvas context available."));
        return;
      }

      // Fill with black fallback for transparency
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      try {
        const base64 = canvas.toDataURL("image/jpeg", 0.75);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = (err) => {
      reject(new Error("Failed to load source image for cropping."));
    };
  });
};

