'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ExternalLink, Filter, Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRestaurant } from '@/lib/context/restaurant-context';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  plan: 'free' | 'pro';
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export default function RestaurantsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { restaurants: contextRestaurants, setCurrentRestaurant } = useRestaurant();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch restaurants from Supabase
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('restaurants')
          .select(
            `
            id,
            name,
            slug,
            owner_id,
            plan,
            created_at,
            profiles:owner_id(email, full_name)
          `
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setRestaurants(data || []);
        setFilteredRestaurants(data || []);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Error al cargar los restaurantes');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [supabase]);

  // Filter restaurants based on search term and plan
  useEffect(() => {
    let filtered = restaurants;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlan !== 'all') {
      filtered = filtered.filter((r) => r.plan === filterPlan);
    }

    setFilteredRestaurants(filtered);
  }, [searchTerm, filterPlan, restaurants]);

  const handleSelectRestaurant = (restaurantId: string) => {
    const target = contextRestaurants.find(r => r.id === restaurantId);
    if (target) {
      setCurrentRestaurant(target);
    }
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-600">Cargando restaurantes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-900 font-semibold mb-2">Error</h2>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
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

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
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
                    {restaurant.profiles?.email}
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
                    {new Date(restaurant.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleSelectRestaurant(restaurant.id)}
                      className="inline-flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium hover:underline"
                    >
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">No se encontraron restaurantes</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {restaurant.profiles?.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    restaurant.plan === 'pro'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {restaurant.plan === 'pro' ? 'Pro' : 'Gratis'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Creado: {new Date(restaurant.created_at).toLocaleDateString('es-ES')}
              </p>
              <button
                onClick={() => handleSelectRestaurant(restaurant.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
              >
                <span>Ver</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {filteredRestaurants.length} de {restaurants.length} restaurantes
      </div>
    </div>
  );
}
