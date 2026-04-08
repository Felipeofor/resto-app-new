'use client'

import { useState } from 'react'

interface FoodImageProps {
  src: string | null
  alt: string
  className?: string
  fallbackClassName?: string
  logoUrl?: string | null
}

export function FoodImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  logoUrl,
}: FoodImageProps) {
  const [errored, setErrored] = useState(false)

  // No image at all → placeholder
  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-orange-50 ${fallbackClassName || className}`}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="logo"
            className="w-10 h-10 object-contain opacity-40"
          />
        ) : (
          <span className="text-3xl select-none">🍽️</span>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}
