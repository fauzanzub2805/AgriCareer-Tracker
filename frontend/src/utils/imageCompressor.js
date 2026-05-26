/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} options.maxWidth - Maximum width of the compressed image.
 * @param {number} options.maxHeight - Maximum height of the compressed image.
 * @param {number} options.quality - Quality of the output JPEG (0.0 to 1.0).
 * @returns {Promise<File>} A promise that resolves to the compressed File object.
 */
export function compressImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.7 } = {}) {
  // If the file is not an image, return it as-is
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio and scale down if exceeding maxWidth or maxHeight
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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Enable high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to original file if blob creation fails
              resolve(file);
              return;
            }
            // Derive a filename with .jpg extension
            const originalName = file.name || 'image.jpg';
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const newFileName = `${baseName}_compressed.jpg`;

            const compressedFile = new File([blob], newFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    };
    reader.onerror = () => {
      resolve(file);
    };
  });
}
