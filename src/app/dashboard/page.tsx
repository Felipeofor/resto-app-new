'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Eye,
  Download,
  Mail,
  QrCode,
  UtensilsCrossed,
} from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalItems: number;
  totalCategories: number;
  emailsCollected: number;
  qrScansThisMonth: number;
}

interface RecentEmail {
  id: string;
  email: string;
  name: string | null;
  registered_via: 'manual' | 'google';
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentRestaurant } = useRestaurant();
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalCategories: 0,
    emailsCollected: 0,
    qrScansThisMonth: 0,
  });
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const restaurantId = currentRestaurant.id;

        // Fetch menu items count
        const { count: itemsCount } = await supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId);

        // Fetch menu categories count
        const { count: categoriesCount } = await supabase
          .from('menu_categories')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId);

        // Fetch customer emails count
        const { count: emailsCount } = await supabase
          .from('customer_emails')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId);

        // Fetch QR scans this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { count: scansCount } = await supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', restaurantId)
          .eq('event_type', 'qr_scan')
          .gte('created_at', monthStart);

        // Fetch recent customer emails (last 5)
        const { data: emails } = await supabase
          .from('customer_emails')
          .select('id, email, name, registered_via, created_at')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalItems: itemsCount || 0,
          totalCategories: categoriesCount || 0,
          emailsCollected: emailsCount || 0,
          qrScansThisMonth: scansCount || 0,
        });

        setRecentEmails((emails || []) as RecentEmail[]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [currentRestaurant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!currentRestaurant) {
    router.push('/dashboard/settings');
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {currentRestaurant.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Bienvenido a tu panel de administración
        </p>
      </div>

      {/* Stats Grid - Mobile responsive: 2x2 on mobile, 4 columns on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Items Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Total de Platos
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {stats.totalItems}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Categorías
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {stats.totalCategories}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-lg sm:text-xl font-bold text-indigo-600">
              ▦
            </div>
          </div>
        </div>

        {/* Emails Collected Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Emails Recogidos
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {stats.emailsCollected}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* QR Scans Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">
                Escaneos QR (Mes)
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                {stats.qrScansThisMonth}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Stack vertically on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link
          href="/dashboard/menu/new"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm sm:text-base">Agregar Plato</span>
        </Link>

        <Link
          href="/dashboard/menu"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Eye className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm sm:text-base">Ver Menú</span>
        </Link>

        <Link
          href="/dashboard/qr"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Download className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm sm:text-base">Descargar QR</span>
        </Link>
      </div>

      {/* Recent Emails Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Últimos Emails Recogidos
          </h2>
          <Link
            href="/dashboard/emails"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Método
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEmails.map((email) => (
                <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                    {email.email}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-700">
                    {email.name || '-'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                    <span
                      className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        email.registered_via === 'google'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {email.registered_via === 'google' ? 'Google' : 'Manual'}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentEmails.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              No hay emails recogidos aún
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
