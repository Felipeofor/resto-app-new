'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRestaurant } from '@/lib/context/restaurant-context';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
}

export default function MenuPage() {
  const { currentRestaurant } = useRestaurant();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (currentRestaurant) {
      fetchData();
    }
  }, [currentRestaurant]);

  const fetchData = async () => {
    if (!currentRestaurant) return;

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('id, name')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, price, category_id, image_url, is_available, sort_order')
        .eq('restaurant_id', currentRestaurant.id)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos del menú');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      const supabase = createClient();
      const { error: supabaseError } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      setMenuItems(menuItems.filter((item) => item.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Error al eliminar plato');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;

    try {
      const supabase = createClient();
      const { error: supabaseError } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', id);

      if (supabaseError) throw supabaseError;

      setMenuItems(
        menuItems.map((menuItem) =>
          menuItem.id === id
            ? { ...menuItem, is_available: !menuItem.is_available }
            : menuItem
        )
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
      setError('Error al cambiar disponibilidad');
    }
  };

  const displayItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  const groupedItems = categories
    .map((cat) => ({
      ...cat,
      items: displayItems.filter((item) => item.category_id === cat.id),
    }))
    .filter((cat) => cat.items.length > 0 || selectedCategory === 'all');

  if (!currentRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando restaurante...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando menú...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Menú</h1>
          <p className="text-gray-600 mt-2">
            Administra los platos de tu restaurante
          </p>
        </div>
        <Link
          href="/dashboard/menu/new"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar Plato</span>
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Total Platos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{menuItems.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Disponibles</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {menuItems.filter((item) => item.is_available).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">No Disponibles</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {menuItems.filter((item) => !item.is_available).length}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filtrar por categoría:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items by Category */}
      <div className="space-y-8">
        {groupedItems.map((category) => (
          <div key={category.id} className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-purple-200 pb-3">
              {category.name}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Drag Handle */}
                    <div className="flex-shrink-0 flex items-start pt-1">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                    </div>

                    {/* Image */}
                    <div className="flex-shrink-0 w-full md:w-auto">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full md:w-20 h-40 md:h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full md:w-20 h-40 md:h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                      <p className="text-purple-600 font-bold text-lg mt-1">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex gap-2 flex-shrink-0 w-full md:w-auto">
                      {/* Availability Toggle */}
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`flex-1 md:flex-none p-2 rounded-lg transition-all ${
                          item.is_available
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {item.is_available ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>

                      {/* Edit */}
                      <Link
                        href={`/dashboard/menu/new?id=${item.id}`}
                        className="flex-1 md:flex-none p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all flex items-center justify-center"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="flex-1 md:flex-none p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === item.id && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 font-medium mb-3">
                        ¿Eliminar este plato?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmDelete(item.id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {displayItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No hay platos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  );
}
