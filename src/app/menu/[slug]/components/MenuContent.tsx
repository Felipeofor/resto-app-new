'use client'

import { useState, useEffect } from 'react'
import { Grid3x3, List } from 'lucide-react'
import { ListView } from './ListView'
import { PhotoGridView } from './PhotoGridView'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
}

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

interface MenuContentProps {
  restaurant: Restaurant
  categories: Category[]
  items: MenuItem[]
}

type ViewMode = 'list' | 'grid'

export function MenuContent({
  restaurant,
  categories,
  items,
}: MenuContentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : items

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Cover Image */}
      {restaurant.cover_url && (
        <div className="relative h-48 md:h-64 w-full overflow-hidden">
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      )}

      {/* Restaurant Header */}
      <div className="px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Logo and Name */}
          <div className="flex items-center gap-4 mb-6">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-12 md:h-16 object-contain"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  {restaurant.description}
                </p>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
              <span className="hidden sm:inline">Galería</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 pb-8 md:pb-12">
        <div className="max-w-4xl mx-auto">
          {viewMode === 'list' ? (
            <ListView
              items={filteredItems}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          ) : (
            <PhotoGridView
              items={filteredItems}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          )}
        </div>
      </div>
    </div>
  )
}
