'use client'

import { useState } from 'react'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

interface ListViewProps {
  items: MenuItem[]
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
  logoUrl?: string | null
  primaryColor?: string
}

/* ------ Lightbox --------------------------------------------------------------------------------------------------------------------------------------------- */
function ImageLightbox({
  item,
  items,
  onClose,
}: {
  item: MenuItem
  items: MenuItem[]
  onClose: () => void
}) {
  const withImages = items.filter((i) => i.image_url)
  const [idx, setIdx] = useState(withImages.findIndex((i) => i.id === item.id))
  const current = withImages[idx]

  const prev = () => setIdx((i) => (i === 0 ? withImages.length - 1 : i - 1))
  const next = () => setIdx((i) => (i === withImages.length - 1 ? 0 : i + 1))

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white"
        >
          <X className="w-7 h-7" />
        </button>

        {/* Image */}
        <FoodImage
          src={current.image_url}
          alt={current.name}
          className="w-full max-h-[70vh] object-contain rounded-xl"
          fallbackClassName="w-full h-64 rounded-xl"
        />

        {/* Info */}
        <div className="mt-3 text-center text-white">
          <p className="font-bold text-lg">{current.name}</p>
          <p className="text-orange-300 font-semibold">
            ${current.price.toLocaleString('es-AR')}
          </p>
          {current.description && (
            <p className="text-white/70 text-sm mt-1">{current.description}</p>
          )}
        </div>

        {/* Nav arrows */}
        {withImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ------ ListView --------------------------------------------------------------------------------------------------------------------------------------------- */
export function ListView({
  items,
  categories,
  selectedCategory,
  onCategorySelect,
  logoUrl,
  primaryColor = '#f97316',
}: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null)

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedItems = categories.reduce(
    (acc, category) => {
      const categoryItems = filteredItems.filter(
        (item) => item.category_id === category.id
      )
      if (categoryItems.length > 0) {
        acc[category.id] = { name: category.name, items: categoryItems }
      }
      return acc
    },
    {} as Record<string, { name: string; items: MenuItem[] }>
  )

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar platos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

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

      {/* Items */}
      {Object.entries(groupedItems).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No se encontraron platos</p>
        </div>
      ) : (
        Object.entries(groupedItems).map(
          ([categoryId, { name, items: categoryItems }]) => (
            <div key={categoryId} className="space-y-3">
              <div className="border-b-2 border-orange-200 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
              </div>

              <div className="space-y-3">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail --- tap to enlarge */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => item.image_url && setLightboxItem(item)}
                          className={`w-20 h-20 rounded-lg overflow-hidden block focus:outline-none ${item.image_url ? 'cursor-pointer' : 'cursor-default'}`}
                          aria-label={item.image_url ? `Ver foto de ${item.name}` : item.name}
                        >
                          <FoodImage
                            src={item.image_url}
                            alt={item.name}
                            logoUrl={logoUrl}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            fallbackClassName="w-20 h-20 rounded-lg"
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 leading-tight">
                            {item.name}
                          </h3>
                          <span className="text-base font-bold text-orange-600 flex-shrink-0">
                            ${item.price.toLocaleString('es-AR')}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex justify-end">
                          <AddToCartButton
                            menuItemId={item.id}
                            name={item.name}
                            price={item.price}
                            image_url={item.image_url}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <ImageLightbox
          item={lightboxItem}
          items={filteredItems}
          onClose={() => setLightboxItem(null)}
        />
      )}
    </div>
  )
}
