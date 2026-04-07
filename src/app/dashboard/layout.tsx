'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UtensilsCrossed,
  LayoutGrid,
  QrCode,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Store,
  ChefHat,
  Menu,
  X,
  Camera,
} from 'lucide-react';
import { RestaurantProvider } from '@/lib/context/restaurant-context';
import RestaurantSelector from './components/RestaurantSelector';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'super_admin' | 'admin' | 'user';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual Supabase auth
    const mockUser: User = {
      id: 'user-1',
      email: 'admin@restaurant.com',
      full_name: 'Chef Martinez',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
      role: 'admin',
    };
    setUser(mockUser);
    setLoading(false);
  }, []);

  const navItems = [
    {
      label: 'Mi Restaurante',
      href: '/dashboard',
      icon: Store,
      isSuperAdminOnly: false,
    },
    {
      label: 'Menú',
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      isSuperAdminOnly: false,
    },
    {
      label: 'Captura IA',
      href: '/dashboard/menu/ai-capture',
      icon: Camera,
      isSuperAdminOnly: false,
    },
    {
      label: 'Categorías',
      href: '/dashboard/categories',
      icon: LayoutGrid,
      isSuperAdminOnly: false,
    },
    {
      label: 'QR Code',
      href: '/dashboard/qr',
      icon: QrCode,
      isSuperAdminOnly: false,
    },
    {
      label: 'Emails',
      href: '/dashboard/emails',
      icon: Mail,
      isSuperAdminOnly: false,
    },
    {
      label: 'Métricas',
      href: '/dashboard/metrics',
      icon: BarChart3,
      isSuperAdminOnly: false,
    },
    {
      label: 'Todos los Restaurantes',
      href: '/dashboard/restaurants',
      icon: ChefHat,
      isSuperAdminOnly: true,
    },
    {
      label: 'Configuración',
      href: '/dashboard/settings',
      icon: Settings,
      isSuperAdminOnly: false,
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.isSuperAdminOnly || user?.role === 'super_admin'
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || (href !== '/dashboard/menu' && pathname.startsWith(href));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <RestaurantProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg md:hidden"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 text-gray-700" />
          ) : (
            <Menu className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 text-white shadow-xl transition-transform duration-300 flex flex-col ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Logo */}
          <div className="p-5 border-b border-purple-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">RestoQR</h1>
                <p className="text-xs text-purple-300">Panel de Administración</p>
              </div>
            </div>
          </div>

          {/* Restaurant Selector */}
          <div className="border-b border-purple-700/50 py-2">
            <RestaurantSelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                    active
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-purple-700/50 space-y-3">
            <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-sm font-bold">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-purple-300 truncate">{user?.email}</p>
              </div>
            </div>
            <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-all font-medium text-sm">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </div>
      </div>
    </RestaurantProvider>
  );
}
