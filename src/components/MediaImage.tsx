import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

interface MediaImageProps {
  src: string | Blob | undefined | null;
  alt: string;
  className?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({ src, alt, className = '' }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (!src) {
      setResolvedUrl('');
      return;
    }
    if (typeof src === 'string') {
      setResolvedUrl(src);
      return;
    }
    const objUrl = URL.createObjectURL(src);
    setResolvedUrl(objUrl);
    return () => {
      URL.revokeObjectURL(objUrl);
    };
  }, [src]);

  if (!resolvedUrl || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF4E6] to-[#FDEBD7] text-[#8C7A6B] p-2 text-center ${className}`}
        aria-label={alt}
      >
        <ImageOff className="w-7 h-7 mb-1 opacity-60" />
        <span className="text-xs font-bold leading-tight line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      draggable={false}
    />
  );
};
