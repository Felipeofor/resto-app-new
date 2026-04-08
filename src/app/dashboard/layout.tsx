'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  ShoppingBag,
  CreditCard,
  Lock,
  LayoutDashboard,
} from 'lucide-react';
import { RestaurantProvider, useRestaurant } from '@/lib/context/restaurant-context';
import RestaurantSelector from './components/RestaurantSelector';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'super_admin' | 'admin' | 'user';
}

function DashboardInner({
  children,
  user,
  handleLogout,
}: {
  children: React.ReactNode;
  user: User;
  handleLogout: () => void;
}) {
  const pathname = usePathname();
  const { currentRestaurant } = useRestaurant();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isPro = currentRestaurant?.plan === 'pro' || user.role === 'super_admin';

  const navItems = [
    {
      label: 'Mi Restaurante',
      href: '/dashboard',
      icon: Store,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
    {
      label: 'Menú',
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
    {
      label: 'Categorías',
      href: '/dashboard/categories',
      icon: LayoutGrid,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
    {
      label: 'QR Code',
      href: '/dashboard/qr',
      icon: QrCode,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
    {
      label: 'Captura IA',
      href: '/dashboard/menu/ai-capture',
      icon: Camera,
      requiresPro: true,
      isSuperAdminOnly: false,
    },
    {
      label: 'Pedidos',
      href: '/dashboard/orders',
      icon: ShoppingBag,
      requiresPro: true,
      isSuperAdminOnly: false,
    },
    {
      label: 'Emails',
      href: '/dashboard/emails',
      icon: Mail,
      requiresPro: true,
      isSuperAdminOnly: false,
    },
    {
      label: 'Métricas',
      href: '/dashboard/metrics',
      icon: BarChart3,
      requiresPro: true,
      isSuperAdminOnly: false,
    },
    {
      label: 'Suscripción',
      href: '/dashboard/subscription',
      icon: CreditCard,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
    {
      label: 'Panel Admin',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
      requiresPro: false,
      isSuperAdminOnly: true,
    },
    {
      label: 'Gestión Pagos',
      href: '/dashboard/admin/subscriptions',
      icon: CreditCard,
      requiresPro: false,
      isSuperAdminOnly: true,
    },
    {
      label: 'Todos los Restaurantes',
      href: '/dashboard/restaurants',
      icon: ChefHat,
      requiresPro: false,
      isSuperAdminOnly: true,
    },
    {
      label: 'Configuración',
      href: '/dashboard/settings',
      icon: Settings,
      requiresPro: false,
      isSuperAdminOnly: false,
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.isSuperAdminOnly || user.role === 'super_admin'
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || (href !== '/dashboard/menu' && pathname.startsWith(href));
  };

  return (
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

        {/* Plan badge */}
        <div className="px-4 py-2 border-b border-purple-700/50">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isPro
              ? 'bg-yellow-400/20 text-yellow-300'
              : 'bg-gray-400/20 text-gray-300'
          }`}>
            {isPro ? '⭐ Plan Pro' : 'Plan Gratuito'}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const locked = item.requiresPro && !isPro;
            return (
              <Link
                key={item.href}
                href={locked ? '/dashboard/subscription' : item.href}
                onClick={() => setSidebarOpen(false)}
                title={locked ? 'Disponible en el Plan Pro' : ''}
                className={`group relative flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  locked
                    ? 'text-purple-400/50'
                    : active
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {locked && (
                  <>
                    <Lock className="w-3.5 h-3.5 text-purple-400/50" />
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Requiere Plan Pro
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-purple-700/50 space-y-3">
          <div className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-white/10">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-sm font-bold">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-purple-300 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-all font-medium text-sm"
          >
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
        <div className="p-6 md:p-8 pt-16 md:pt-8">{children}</div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push('/login');
          return;
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, avatar_url')
          .eq('id', authUser.id)
          .single();
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          role: profile?.role || 'admin',
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <RestaurantProvider>
      <DashboardInner user={user} handleLogout={handleLogout}>
        {children}
      </DashboardInner>
    </RestaurantProvider>
  );
}
