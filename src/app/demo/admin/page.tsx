'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  LayoutGrid,
  QrCode,
  Mail,
  BarChart3,
  Store,
  ShoppingBag,
  Menu,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  Search,
  Clock,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

/* ---------- types ---------- */
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
}
interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  description: string | null;
}
interface CustomerEmail {
  id: string;
  email: string;
  name: string | null;
  registered_via: 'manual' | 'google';
  created_at: string;
}
interface AnalyticsEvent {
  event_type: string;
  created_at: string;
}
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}
interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  order_items?: OrderItem[];
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface DemoData {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  emails: CustomerEmail[];
  events: AnalyticsEvent[];
  orders: Order[];
}

/* ---------- nav items ---------- */
const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: Store },
  { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
  { id: 'categories', label: 'Categorias', icon: LayoutGrid },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'metrics', label: 'Metricas', icon: BarChart3 },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'finance', label: 'Finanzas', icon: Wallet },
];

/* ---------- status config ---------- */
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'En Preparacion', color: 'bg-orange-100 text-orange-800' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function DemoAdminPage() {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/demo')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          console.error(json.error);
        } else {
          setData(json);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900">
        <div className="text-white text-xl">Cargando demo...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demo no disponible</h2>
          <p className="text-gray-600 mb-6">
            El restaurante demo aun no fue configurado.
          </p>
          <Link
            href="/demo"
            className="text-purple-600 font-semibold hover:text-purple-700"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-purple-300">Demo - Solo Lectura</p>
            </div>
          </div>
        </div>

        {/* Restaurant name */}
        <div className="px-4 py-3 border-b border-purple-700/50">
          <p className="text-sm font-semibold text-white truncate">
            {data.restaurant.name}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 mt-1">
            Vista Demo
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  active
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-purple-700/50 space-y-2">
          <Link
            href="/menu/don-carlos"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40 transition-all font-medium text-sm"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Menu Cliente</span>
          </Link>
          <Link
            href="/demo"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-white/10 text-purple-200 hover:bg-white/20 transition-all font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Demo</span>
          </Link>
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
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-center">
          <p className="text-sm font-semibold text-amber-900">
            Modo Demo - Solo lectura.{' '}
            <Link href="/register" className="underline hover:no-underline">
              Crea tu cuenta gratis
            </Link>{' '}
            para gestionar tu propio restaurante.
          </p>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          {activeSection === 'dashboard' && <DashboardSection data={data} />}
          {activeSection === 'menu' && <MenuSection data={data} />}
          {activeSection === 'categories' && <CategoriesSection data={data} />}
          {activeSection === 'orders' && <OrdersSection data={data} />}
          {activeSection === 'emails' && <EmailsSection data={data} />}
          {activeSection === 'metrics' && <MetricsSection data={data} />}
          {activeSection === 'qr' && <QRSection data={data} />}
          {activeSection === 'finance' && <FinanceSection />}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Dashboard
   ============================================ */
function DashboardSection({ data }: { data: DemoData }) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const qrScansThisMonth = data.events.filter(
    (e) => e.event_type === 'qr_scan' && new Date(e.created_at) >= monthStart
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
          {data.restaurant.name}
        </h1>
        <p className="text-gray-600 mt-2">Panel de administracion (demo)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          label="Total de Platos"
          value={data.items.length}
          color="purple"
          icon={<UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
        />
        <StatCard
          label="Categorias"
          value={data.categories.length}
          color="indigo"
          icon={<span className="text-lg sm:text-xl font-bold text-indigo-600">&#9638;</span>}
        />
        <StatCard
          label="Emails Recogidos"
          value={data.emails.length}
          color="blue"
          icon={<Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />}
        />
        <StatCard
          label="Escaneos QR (Mes)"
          value={qrScansThisMonth}
          color="green"
          icon={<QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {}}
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white opacity-75 cursor-default"
        >
          <span className="font-semibold text-sm sm:text-base">Agregar Plato (Demo)</span>
        </button>
        <Link
          href="/menu/don-carlos"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition-all"
        >
          <Eye className="w-5 h-5 flex-shrink-0" />
          <span className="font-semibold text-sm sm:text-base">Ver Menu</span>
        </Link>
        <button
          onClick={() => {}}
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white opacity-75 cursor-default"
        >
          <span className="font-semibold text-sm sm:text-base">Descargar QR (Demo)</span>
        </button>
      </div>

      {/* Recent Emails */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
          Ultimos Emails Recogidos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Metodo
                </th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {data.emails.slice(0, 5).map((email) => (
                <tr key={email.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 text-xs sm:text-sm text-gray-900">
                    {email.email}
                  </td>
                  <td className="px-3 py-3 text-xs sm:text-sm text-gray-700">
                    {email.name || '-'}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 text-xs sm:text-sm">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      Email
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 text-xs sm:text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.emails.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">
            No hay emails recogidos aun
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Menu
   ============================================ */
function MenuSection({ data }: { data: DemoData }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const displayItems =
    selectedCategory === 'all'
      ? data.items
      : data.items.filter((item) => item.category_id === selectedCategory);

  const groupedItems = data.categories
    .map((cat) => ({
      ...cat,
      items: displayItems.filter((item) => item.category_id === cat.id),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Menu</h1>
        <p className="text-gray-600 mt-2">
          Visualizacion del menu del restaurante (solo lectura)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Total Platos</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{data.items.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Disponibles</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {data.items.filter((i) => i.is_available).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">No Disponibles</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {data.items.filter((i) => !i.is_available).length}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Filtrar por categoria:
        </p>
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
          {data.categories.map((cat) => (
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

      {/* Items by Category */}
      <div className="space-y-8">
        {groupedItems.map((category) => (
          <div key={category.id} className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 border-b-2 border-purple-200 pb-3">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full sm:w-20 h-32 sm:h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full sm:w-20 h-32 sm:h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {item.name}
                        </h3>
                        <div
                          className={`flex-shrink-0 p-1.5 rounded-lg ${
                            item.is_available
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {item.is_available ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                      <p className="text-purple-600 font-bold text-lg mt-1">
                        ${item.price.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {displayItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No hay platos en esta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Categories
   ============================================ */
function CategoriesSection({ data }: { data: DemoData }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Categorias</h1>
        <p className="text-gray-600 mt-2">
          Organizacion del menu en categorias (solo lectura)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
        <p className="text-gray-600 text-sm font-medium">Total de Categorias</p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
          {data.categories.length}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {data.categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No hay categorias aun</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data.categories.map((category, index) => {
              const itemCount = data.items.filter(
                (i) => i.category_id === category.id
              ).length;
              return (
                <div key={category.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                        {itemCount} platos
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Orders
   ============================================ */
function OrdersSection({ data }: { data: DemoData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const orders = data.orders || [];

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    return orders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const stats = {
    total: orders.length,
    revenue: orders
      .filter((o) => o.order_status === 'delivered' || o.order_status === 'confirmed')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    pending: orders.filter((o) => o.order_status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-600 mt-1">
          Vista de pedidos del restaurante (solo lectura)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Total Pedidos</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Ingresos</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            ${stats.revenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Pendientes</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por numero de pedido o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No hay pedidos</p>
            <p className="text-gray-400 text-sm mt-1">
              Los pedidos aparecen cuando los clientes realizan sus ordenes
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const items = order.order_items || [];
            const itemsSummary = items
              .map((i) => `${i.quantity}x ${i.name}`)
              .join(', ');

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-gray-900">
                        {order.order_number}
                      </span>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[order.order_status]?.color ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusConfig[order.order_status]?.label || order.order_status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{order.customer_name}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {itemsSummary || 'Sin items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${(order.total || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Emails
   ============================================ */
function EmailsSection({ data }: { data: DemoData }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return data.emails;
    return data.emails.filter(
      (e) =>
        e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.emails, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Emails Recogidos</h1>
        <p className="text-gray-600 mt-2">
          Lista de clientes que compartieron su email (solo lectura)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Emails Totales</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{data.emails.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Modo</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Demo</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Metodo
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((email) => (
              <tr
                key={email.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4 text-sm font-mono text-gray-900">
                  {email.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {email.name || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                    Email
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(email.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No se encontraron emails</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600">No se encontraron emails</p>
          </div>
        ) : (
          filtered.map((email) => (
            <div key={email.id} className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              <p className="text-sm font-mono text-gray-900">{email.email}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{email.name || '-'}</span>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                  Email
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(email.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-gray-600 text-center">
        Mostrando {filtered.length} de {data.emails.length} emails
      </div>
    </div>
  );
}

/* ============================================
   SECTION: Metrics
   ============================================ */
function MetricsSection({ data }: { data: DemoData }) {
  const events = data.events || [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalVisits = events.filter((e) => e.event_type === 'visit').length;
  const qrScans = events.filter((e) => e.event_type === 'qr_scan').length;
  const emailsThisMonth = events.filter(
    (e) =>
      e.event_type === 'email_register' && new Date(e.created_at) >= monthStart
  ).length;

  // Build daily data
  const dailyData: Record<string, { visits: number; scans: number }> = {};
  events.forEach((event) => {
    const date = new Date(event.created_at).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
    if (!dailyData[date]) dailyData[date] = { visits: 0, scans: 0 };
    if (event.event_type === 'visit') dailyData[date].visits++;
    if (event.event_type === 'qr_scan') dailyData[date].scans++;
  });

  const dailyVisits = Object.entries(dailyData).map(([date, d]) => ({
    date,
    count: d.visits,
  }));
  const dailyScans = Object.entries(dailyData).map(([date, d]) => ({
    date,
    count: d.scans,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Metricas</h1>
        <p className="text-gray-600 mt-2">
          Analisis de visitas y engagement (solo lectura)
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Visitas (30d)</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {totalVisits}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Escaneos QR (30d)</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {qrScans}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Emails Este Mes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {emailsThisMonth}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Visitas (Ultimos 30 dias)
          </h2>
          <SimpleBarChart data={dailyVisits} color="blue" />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Escaneos QR (Ultimos 30 dias)
          </h2>
          <SimpleBarChart data={dailyScans} color="green" />
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h3 className="font-bold text-blue-900 mb-2">Como se recopilan estas metricas</h3>
        <p className="text-sm text-blue-800">
          Las visitas se cuentan cada vez que alguien abre el menu. Los escaneos QR se registran cuando alguien usa el codigo QR. Los emails cuentan cada nuevo registro.
        </p>
      </div>
    </div>
  );
}

/* ============================================
   SECTION: QR
   ============================================ */
function QRSection({ data }: { data: DemoData }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const menuUrl = origin ? `${origin}/menu/${data.restaurant.slug}` : `/menu/${data.restaurant.slug}`;

  useEffect(() => {
    if (!origin) return;
    import('qrcode').then((QRCodeModule) => {
      const QRCode = QRCodeModule.default;
      QRCode.toDataURL(menuUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#6d28d9', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(setQrDataUrl).catch(console.error);
    });
  }, [menuUrl, origin]);

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${data.restaurant.slug}.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Codigo QR</h1>
        <p className="text-gray-600 mt-2">
          Escanea para ver el menu digital del restaurante
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
        {/* QR Image */}
        <div className="inline-block p-4 bg-white border-2 border-purple-200 rounded-2xl mb-6 shadow-sm">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Codigo QR del menu"
              className="w-48 h-48 sm:w-64 sm:h-64"
            />
          ) : (
            <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded-xl flex items-center justify-center animate-pulse">
              <QrCode className="w-16 h-16 text-gray-300" />
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {data.restaurant.name}
        </h2>
        <p className="text-gray-500 text-sm mb-6">Menu Digital</p>

        {/* URL */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 font-mono text-left truncate">
            {menuUrl}
          </div>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
          >
            Descargar PNG
          </button>
          <Link
            href={`/menu/${data.restaurant.slug}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all font-semibold"
          >
            <Eye className="w-5 h-5" />
            Ver Menu
          </Link>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
        <p className="text-sm text-purple-800">
          En tu cuenta real podras personalizar el color del QR, agregar tu logo al centro e imprimirlo en diferentes formatos para tus mesas.
        </p>
      </div>
    </div>
  );
}

/* ============================================
   SHARED COMPONENTS
   ============================================ */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  const borderColors: Record<string, string> = {
    purple: 'border-purple-500',
    indigo: 'border-indigo-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
  };
  const bgColors: Record<string, string> = {
    purple: 'bg-purple-100',
    indigo: 'bg-indigo-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm p-4 sm:p-6 border-l-4 ${borderColors[color]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs sm:text-sm font-medium">{label}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bgColors[color]} flex items-center justify-center flex-shrink-0`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  color = 'green',
}: {
  data: Array<{ date: string; count: number }>;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;

  const gradients: Record<string, string> = {
    green: 'from-green-400 to-green-500 hover:from-green-500 hover:to-green-600',
    blue: 'from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600',
    purple: 'from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600',
  };

  return (
    <div className="flex items-end gap-1 h-64 p-4 bg-gray-50 rounded-lg overflow-x-auto">
      {data.map((item, idx) => {
        const height = (item.count / maxCount) * chartHeight;
        return (
          <div
            key={idx}
            className={`flex-1 min-w-[16px] bg-gradient-to-t ${gradients[color]} rounded-t transition-all relative group`}
            style={{ height: `${Math.max(height, 4)}px` }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {item.count} ({item.date})
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================================================
   SECTION: Finance (Demo)
======================================================================== */
function FinanceSection() {
  const demoTransactions = [
    { type: 'income', amount: 85000, category: 'Ventas', icon: '💰', date: '07/04', desc: 'Ventas del dia' },
    { type: 'income', amount: 23000, category: 'Delivery', icon: '🛵', date: '07/04', desc: 'Pedidos PedidosYa' },
    { type: 'expense', amount: 45000, category: 'Insumos', icon: '🥩', date: '07/04', desc: 'Compra de carne y verduras' },
    { type: 'expense', amount: 120000, category: 'Sueldos', icon: '👥', date: '06/04', desc: 'Sueldos staff cocina' },
    { type: 'income', amount: 92000, category: 'Ventas', icon: '💰', date: '06/04', desc: 'Ventas del dia' },
    { type: 'expense', amount: 15000, category: 'Servicios', icon: '💡', date: '05/04', desc: 'Factura de luz' },
    { type: 'income', amount: 18000, category: 'Eventos', icon: '🎉', date: '05/04', desc: 'Cumpleanos privado' },
    { type: 'expense', amount: 8500, category: 'Marketing', icon: '📣', date: '04/04', desc: 'Publicidad Instagram' },
  ];

  const totalIncome = demoTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = demoTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Finanzas</h1>
        <p className="text-gray-600 mt-2">Control de ingresos y egresos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-green-700">${totalIncome.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Egresos</span>
          </div>
          <p className="text-2xl font-bold text-red-700">${totalExpense.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Balance</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">${balance.toLocaleString('es-AR')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Movimientos recientes</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {demoTransactions.map((t, i) => (
            <div key={i} className="px-6 py-3 flex items-center gap-4">
              <span className="text-xl w-8 text-center">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{t.desc}</p>
                <p className="text-xs text-gray-400">{t.category} - {t.date}</p>
              </div>
              <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
