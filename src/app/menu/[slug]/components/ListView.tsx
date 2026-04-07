'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

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
}

export function ListView({
  items,
  categories,
  selectedCategory,
  onCategorySelect,
}: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedItems = categories.reduce(
    (acc, category) => {
      const categoryItems = filteredItems.filter(
        (item) => item.category_id === category.id
      )
      if (categoryItems.length > 0) {
        acc[category.id] = {
          name: category.name,
          items: categoryItems,
        }
      }
      return acc
    },
    {} as Record<string, { name: string; items: MenuItem[] }>
  )

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar platos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

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

      {/* Menu Items */}
      {Object.entries(groupedItems).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No se encontraron platos con esa búsqueda
          </p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([categoryId, { name, items: categoryItems }]) => (
          <div key={categoryId} className="space-y-4">
            {/* Category Header */}
            <div className="border-b-2 border-orange-200 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
            </div>

            {/* Category Items */}
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    {item.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <div className="text-lg font-bold text-orange-600 flex-shrink-0">
                          €{item.price.toFixed(2)}
                        </div>
                      </div>

                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
