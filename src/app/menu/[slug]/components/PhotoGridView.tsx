'use client'

import { useState } from 'react'
import { Lightbox } from './Lightbox'
import { AddToCartButton } from './AddToCartButton'
import { FoodImage } from './FoodImage'

interface Category {
  id: string
  name: string
  sort_order: number
}

interface MenuItem {
  id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
}

interface PhotoGridViewProps {
  items: MenuItem[]
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
  logoUrl?: string | null
  primaryColor?: string
}

export function PhotoGridView({
  items,
  categories,
  selectedCategory,
  onCategorySelect,
  logoUrl,
  primaryColor = '#f97316',
}: PhotoGridViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)

  const itemsWithImages = items.filter((item) => item.image_url)

  const openLightbox = (index: number) => {
    setSelectedItemIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const handleNextItem = () => {
    setSelectedItemIndex((prev) =>
      prev === itemsWithImages.length - 1 ? 0 : prev + 1
    )
  }

  const handlePrevItem = () => {
    setSelectedItemIndex((prev) =>
      prev === 0 ? itemsWithImages.length - 1 : prev - 1
    )
  }

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => onCategorySelect(null)}
          className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? 'text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
          style={selectedCategory === null ? { background: primaryColor } : undefined}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
            style={selectedCategory === category.id ? { background: primaryColor } : undefined}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Grid - shows ALL items, with or without images */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay platos en esta categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item, index) => {
            const imgIndex = itemsWithImages.findIndex((i) => i.id === item.id)
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col"
              >
                {/* Image or placeholder */}
                <div className="relative h-36 md:h-44 bg-orange-50 overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => imgIndex >= 0 && openLightbox(imgIndex)}
                    className={`w-full h-full ${imgIndex >= 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <FoodImage
                      src={item.image_url}
                      alt={item.name}
                      logoUrl={logoUrl}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      fallbackClassName="w-full h-full"
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-1">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2.5">
                    <div className="flex items-center">
                      <span className="text-xl font-bold text-orange-600 block w-full text-center">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(item.price)}
                      </span>
                    </div>
                    <div className="w-full">
                      <AddToCartButton
                        menuItemId={item.id}
                        name={item.name}
                        price={item.price}
                        image_url={item.image_url}
                        fullWidth={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          items={itemsWithImages}
          initialIndex={selectedItemIndex}
          onClose={closeLightbox}
          onNext={handleNextItem}
          onPrev={handlePrevItem}
        />
      )}
    </div>
  )
}
