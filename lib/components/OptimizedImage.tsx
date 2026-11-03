/**
 * Phase 3: Optimized Image Component
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Responsive srcset (mobile, tablet, desktop)
 * - WebP with fallback to original format
 * - Error handling and placeholder
 * - Prevents CLS (Cumulative Layout Shift)
 * 
 * Usage:
 *   <OptimizedImage
 *     src="/images/post-thumbnail.png"
 *     alt="Post title"
 *     priority={false}
 *     width={1200}
 *     height={600}
 *   />
 */

import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import Image from 'next/image';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Calculate responsive srcset from base image path
 */
function generateSrcSet(imagePath: string): {
  webp: string;
  original: string;
  variants: { [key: string]: string };
} {
  const ext = imagePath.split('.').pop();
  const basePath = imagePath.replace(new RegExp(`\\.${ext}$`), '');

  return {
    webp: `${basePath}.webp`,
    original: imagePath,
    variants: {
      '400w': `${basePath}-400w.webp`,
      '800w': `${basePath}-800w.webp`,
      '1200w': `${basePath}-1200w.webp`,
    },
  };
}

/**
 * Optimized Image Component
 */
export default function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 600,
  priority = false,
  className = '',
  containerClassName = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const srcSet = generateSrcSet(src);
  const aspectRatio = width / height;

  // Lazy load with IntersectionObserver
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            const img = imgRef.current as HTMLImageElement;
            
            // Load WebP with fallback
            img.srcset = `
              ${srcSet.variants['400w']} 400w,
              ${srcSet.variants['800w']} 800w,
              ${srcSet.variants['1200w']} 1200w
            `;
            
            // Fallback source
            img.src = srcSet.original;
            
            // Remove lazy attribute after loading
            img.removeAttribute('loading');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' } // Start loading 50px before visible
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [srcSet, priority]);

  // Handle load completion
  const handleLoad = () => {
    setIsLoaded(true);
    if (props.onLoad) {
      props.onLoad({} as any);
    }
  };

  const handleError = () => {
    setHasError(true);
    if (props.onError) {
      props.onError({} as any);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}
      style={{
        aspectRatio: `${aspectRatio}`,
      }}
    >
      {/* WebP with fallback */}
      <picture>
        <source
          srcSet={`
            ${srcSet.variants['400w']} 400w,
            ${srcSet.variants['800w']} 800w,
            ${srcSet.variants['1200w']} 1200w
          `}
          type="image/webp"
        />
        <img
          ref={imgRef}
          src={hasError ? srcSet.original : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </picture>

      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Error placeholder */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-sm text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}

/**
 * Next.js Image Component with Phase 3 optimizations
 * (Alternative to OptimizedImage for projects using Next/Image)
 */
export function OptimizedNextImage({
  src,
  alt,
  width = 1200,
  height = 600,
  priority = false,
  className = '',
  containerClassName = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}
      style={{
        aspectRatio: `${width / height}`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8//8/AwAI/AL+O10NrwAAAABJRU5ErkJggg=="
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoadingComplete={() => setIsLoaded(true)}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  );
}
