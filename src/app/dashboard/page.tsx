'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Eye,
  Download,
  Mail,
  QrCode,
  UtensilsCrossed,
  TrendingUp,
} from 'lucide-react';

interface User {
  role: 'super_admin' | 'admin' | 'user';
}

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
  registered_via: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    totalCategories: 0,
    emailsCollected: 0,
    qrScansThisMonth: 0,
  });
  const [recentEmails, setRecentEmails] = useState<RecentEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock user data
    const mockUser: User = {
      role: 'admin',
    };
    setUser(mockUser);

    // Check if super_admin, redirect to restaurants
    if (mockUser.role === 'super_admin') {
      router.push('/dashboard/restaurants');
      return;
    }

    // Mock dashboard stats
    setStats({
      totalItems: 42,
      totalCategories: 6,
      emailsCollected: 127,
      qrScansThisMonth: 543,
    });

    // Mock recent emails
    setRecentEmails([
      {
        id: '1',
        email: 'customer1@example.com',
        name: 'Juan García',
        registered_via: 'manual',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        email: 'customer2@example.com',
        name: 'María López',
        registered_via: 'google',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        email: 'customer3@example.com',
        name: 'Carlos Rodríguez',
        registered_via: 'manual',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        email: 'customer4@example.com',
        name: 'Ana Martínez',
        registered_via: 'google',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Mi Restaurante</h1>
        <p className="text-gray-600 mt-2">
          Bienvenido a tu panel de administración
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total de Platos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalItems}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categorías</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalCategories}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <div className="w-6 h-6 text-indigo-600">▦</div>
            </div>
          </div>
        </div>

        {/* Emails Collected Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Emails Recogidos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.emailsCollected}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* QR Scans Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Escaneos QR (Mes)</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.qrScansThisMonth}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/menu/new"
          className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Agregar Plato</span>
        </Link>

        <Link
          href="/dashboard/menu"
          className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Eye className="w-5 h-5" />
          <span className="font-semibold">Ver Menú</span>
        </Link>

        <Link
          href="/dashboard/qr"
          className="flex items-center space-x-3 p-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transition-all hover:scale-105"
        >
          <Download className="w-5 h-5" />
          <span className="font-semibold">Descargar QR</span>
        </Link>
      </div>

      {/* Recent Emails Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Últimos Emails Recogidos</h2>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {recentEmails.map((email) => (
                <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{email.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {email.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        email.registered_via === 'google'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {email.registered_via === 'google' ? 'Google' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
