'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Filter } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  admin_email: string;
  plan: 'free' | 'pro';
  items_count: number;
  created_at: string;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock restaurants data
    const mockRestaurants: Restaurant[] = [
      {
        id: '1',
        name: 'Pizzería Italia',
        admin_email: 'owner1@example.com',
        plan: 'pro',
        items_count: 28,
        created_at: '2024-01-15',
      },
      {
        id: '2',
        name: 'Sushi Palace',
        admin_email: 'owner2@example.com',
        plan: 'pro',
        items_count: 45,
        created_at: '2024-02-10',
      },
      {
        id: '3',
        name: 'Burger House',
        admin_email: 'owner3@example.com',
        plan: 'free',
        items_count: 12,
        created_at: '2024-03-05',
      },
      {
        id: '4',
        name: 'Café Artesano',
        admin_email: 'owner4@example.com',
        plan: 'pro',
        items_count: 35,
        created_at: '2024-03-20',
      },
      {
        id: '5',
        name: 'Tacos Mexicanos',
        admin_email: 'owner5@example.com',
        plan: 'free',
        items_count: 18,
        created_at: '2024-04-01',
      },
    ];

    setRestaurants(mockRestaurants);
    setFilteredRestaurants(mockRestaurants);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = restaurants;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.admin_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by plan
    if (filterPlan !== 'all') {
      filtered = filtered.filter((r) => r.plan === filterPlan);
    }

    setFilteredRestaurants(filtered);
  }, [searchTerm, filterPlan, restaurants]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando restaurantes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Restaurantes</h1>
        <p className="text-gray-600 mt-2">
          Administra todos los restaurantes en la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Total Restaurantes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {restaurants.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Plan Pro</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {restaurants.filter((r) => r.plan === 'pro').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Plan Gratis</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {restaurants.filter((r) => r.plan === 'free').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-sm p-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Plan Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as 'all' | 'free' | 'pro')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los planes</option>
            <option value="free">Plan Gratis</option>
            <option value="pro">Plan Pro</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Restaurante
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Email del Admin
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Platos
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Creado
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map((restaurant) => (
                <tr
                  key={restaurant.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {restaurant.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {restaurant.admin_email}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        restaurant.plan === 'pro'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {restaurant.plan === 'pro' ? 'Pro' : 'Gratis'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {restaurant.items_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(restaurant.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium">
                      <span>Ver</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron restaurantes</p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {filteredRestaurants.length} de {restaurants.length} restaurantes
      </div>
    </div>
  );
}
