'use client';

import React from 'react';
import { getSafeCardImageUrl, handleCardImageError } from '@/lib/card-image';

interface CardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  imageUrl?: string | null;
  cardId?: string | null;
  name?: string;
}

export function CardImage({
  imageUrl,
  cardId,
  name,
  className = '',
  alt,
  ...props
}: CardImageProps) {
  const src = getSafeCardImageUrl(imageUrl, cardId);

  return (
    <img
      src={src}
      alt={alt || name || cardId || 'Card Artwork'}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={(e) => handleCardImageError(e, cardId)}
      {...props}
    />
  );
}
