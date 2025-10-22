import { useEffect, useRef } from 'react';

/**
 * Preload images for smooth gallery navigation
 * @param images Array of image URLs
 * @param currentIndex Current image index
 * @param preloadCount Number of images to preload ahead (default: 6)
 */
export const useImagePreload = (
  images: string[],
  currentIndex: number,
  preloadCount: number = 6
) => {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!images || images.length === 0) return;

    const startIndex = Math.max(0, currentIndex);
    const endIndex = Math.min(images.length, currentIndex + preloadCount);

    // Preload next images
    for (let i = startIndex; i < endIndex; i++) {
      const url = images[i];
      
      // Skip if already preloaded
      if (preloadedRef.current.has(url)) continue;

      // Create image element to trigger browser cache
      const img = new Image();
      img.src = url;
      
      img.onload = () => {
        preloadedRef.current.add(url);
      };
      
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
      };
    }
  }, [images, currentIndex, preloadCount]);
};

/**
 * Preload a batch of images
 */
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(
      url =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${url}`));
        })
    )
  );
};
