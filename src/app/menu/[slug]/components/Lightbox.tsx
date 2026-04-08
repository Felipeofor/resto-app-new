'use client'

import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AddToCartButton } from './AddToCartButton'

interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

interface LightboxProps {
  items: MenuItem[]
  initialIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export function Lightbox({
  items,
  initialIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const currentItem = items[initialIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowRight') {
        onNext()
      } else if (e.key === 'ArrowLeft') {
        onPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, onNext, onPrev])

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 border border-white/20 rounded-full transition-colors z-[60]"
        aria-label="Cerrar"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 border border-white/20 hover:bg-black/80 rounded-full transition-colors z-[60]"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 border border-white/20 hover:bg-black/80 rounded-full transition-colors z-[60]"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          {currentItem.image_url && (
            <img
              src={currentItem.image_url}
              alt={currentItem.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </div>

        {/* Item Details */}
        <div className="md:w-80 flex flex-col justify-center bg-white/5 rounded-lg p-6 md:p-8 backdrop-blur-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {currentItem.name}
          </h2>

          <p className="text-3xl font-bold text-orange-400 mb-6">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(currentItem.price)}
          </p>

          {currentItem.description && (
            <p className="text-gray-100 text-sm md:text-base leading-relaxed mb-6">
              {currentItem.description}
            </p>
          )}

          {/* Counter */}
          <div className="text-gray-400 text-sm mb-6">
            {initialIndex + 1} de {items.length}
          </div>

          <div className="mt-auto">
            <AddToCartButton
              menuItemId={currentItem.id}
              name={currentItem.name}
              price={currentItem.price}
              image_url={currentItem.image_url}
              fullWidth={true}
            />
          </div>

          {/* Navigation Hint */}
          <div className="text-gray-500 text-xs mt-6 border-t border-white/10 pt-4">
            <p>Usa las flechas para navegar</p>
            <p>Presiona ESC para cerrar</p>
          </div>
        </div>
      </div>

      {/* Mobile only - Navigation instructions */}
      <div className="absolute bottom-4 left-4 right-4 md:hidden text-center text-gray-400 text-xs">
        Desliza o usa los botones para navegar
      </div>
    </div>
  )
}
