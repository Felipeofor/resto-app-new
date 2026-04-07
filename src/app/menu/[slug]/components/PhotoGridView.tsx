'use client'

import { useState } from 'react'
import { Lightbox } from './Lightbox'

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
}

export function PhotoGridView({
  items,
  categories,
  selectedCategory,
  onCategorySelect,
}: PhotoGridViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)

  // Filter items with images
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
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {itemsWithImages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay fotos disponibles en esta categoría
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {itemsWithImages.map((item, index) => (
            <button
              key={item.id}
              onClick={() => openLightbox(index)}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all h-64 md:h-72 cursor-pointer"
            >
              {/* Image */}
              <img
                src={item.image_url!}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300"></div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <h3 className="font-semibold text-lg group-hover:text-orange-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-orange-200 font-bold mt-1">
                  €{item.price.toFixed(2)}
                </p>
              </div>
            </button>
          ))}
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
