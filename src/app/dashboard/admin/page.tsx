'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Store,
  CreditCard,
  Mail,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';

interface DashboardStats {
  totalRestaurants: number;
  proRestaurants: number;
  freeRestaurants: number;
  newThisMonth: number;
  totalEmails: number;
  totalRevenue: number;
  pendingPayments: number;
  approvedThisMonth: number;
}

interface ExpiringRestaurant {
  id: string;
  name: string;
  pro_expires_at: string;
  owner_email: string;
}

interface RecentRestaurant {
  id: string;
  name: string;
  plan: 'free' | 'pro';
  created_at: string;
  owner_email: string;
}

interface PendingPayment {
  id: string;
  amount: number;
  created_at: string;
  restaurant_name: string;
  user_email: string;
}

interface MonthlyRevenue {
  month: string;
  count: number;
  total: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRestaurants: 0,
    proRestaurants: 0,
    freeRestaurants: 0,
    newThisMonth: 0,
    totalEmails: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    approvedThisMonth: 0,
  });
  const [expiring, setExpiring] = useState<ExpiringRestaurant[]>([]);
  const [recentRestaurants, setRecentRestaurants] = useState<RecentRestaurant[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all data in parallel
    const [
      restaurantsRes,
      emailsRes,
      paymentsRes,
      pendingRes,
      expiringRes,
    ] = await Promise.all([
      // All restaurants
      supabase
        .from('restaurants')
        .select('id, name, slug, plan, created_at, profiles:owner_id(email)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }) as any,

      // Total emails
      supabase
        .from('customer_emails')
        .select('id', { count: 'exact', head: true }),

      // All approved payments
      supabase
        .from('subscription_payments')
        .select('amount, status, created_at')
        .eq('status', 'approved'),

      // Pending payments with details
      supabase
        .from('subscription_payments')
        .select('id, amount, created_at, restaurants:restaurant_id(name), profiles:user_id(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),

      // Expiring soon (next 10 days)
      (supabase
        .from('restaurants')
        .select('id, name, pro_expires_at, profiles:owner_id(email)')
        .eq('plan', 'pro')
        .not('pro_expires_at', 'is', null)
        .lte('pro_expires_at', new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString())
        .order('pro_expires_at', { ascending: true }) as any),
    ]);

    const restaurants = restaurantsRes.data || [];
    const payments = paymentsRes.data || [];

    // Calculate stats
    const proCount = restaurants.filter(r => r.plan === 'pro').length;
    const freeCount = restaurants.filter(r => r.plan === 'free').length;
    const newThisMonth = restaurants.filter(r => r.created_at >= startOfMonth).length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const approvedThisMonth = payments.filter(p => p.created_at >= startOfMonth).length;

    setStats({
      totalRestaurants: restaurants.length,
      proRestaurants: proCount,
      freeRestaurants: freeCount,
      newThisMonth,
      totalEmails: emailsRes.count || 0,
      totalRevenue,
      pendingPayments: (pendingRes.data || []).length,
      approvedThisMonth,
    });

    // Expiring restaurants
    setExpiring(
      (expiringRes.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        pro_expires_at: r.pro_expires_at,
        owner_email: r.profiles?.email || '',
      }))
    );

    // Recent restaurants (last 5)
    setRecentRestaurants(
      restaurants.slice(0, 5).map((r: any) => ({
        id: r.id,
        name: r.name,
        plan: r.plan,
        created_at: r.created_at,
        owner_email: r.profiles?.email || '',
      }))
    );

    // Pending payments
    setPendingPayments(
      (pendingRes.data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        created_at: p.created_at,
        restaurant_name: p.restaurants?.name || 'Desconocido',
        user_email: p.profiles?.email || '',
      }))
    );

    // Monthly revenue (last 6 months)
    const monthlyMap = new Map<string, { count: number; total: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { count: 0, total: 0 });
    }
    payments.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.count++;
        entry.total += p.amount;
      }
    });
    setMonthlyRevenue(
      Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }))
    );

    setLoading(false);
  };

  const daysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando dashboard...</div>
      </div>
    );
  }

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.total), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
        <p className="text-gray-600 mt-1">Resumen general de RestoQR</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Store}
          label="Total Restaurantes"
          value={stats.totalRestaurants}
          sub={`+${stats.newThisMonth} este mes`}
          color="purple"
        />
        <StatCard
          icon={TrendingUp}
          label="Plan Pro"
          value={stats.proRestaurants}
          sub={`${stats.freeRestaurants} gratuitos`}
          color="blue"
        />
        <StatCard
          icon={CreditCard}
          label="Ingresos Totales"
          value={`$${stats.totalRevenue.toLocaleString('es-AR')}`}
          sub={`${stats.approvedThisMonth} aprobados este mes`}
          color="green"
        />
        <StatCard
          icon={Mail}
          label="Emails Recolectados"
          value={stats.totalEmails}
          sub="En toda la plataforma"
          color="amber"
        />
      </div>

      {/* Alerts: Expiring + Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-gray-900">Planes por vencer</h2>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              {expiring.length} restaurantes
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {expiring.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No hay planes por vencer en los proximos 10 dias
              </div>
            ) : (
              expiring.map(r => {
                const days = daysUntil(r.pro_expires_at);
                return (
                  <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.owner_email}</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      days <= 0
                        ? 'bg-red-100 text-red-700'
                        : days <= 3
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}>
                      {days <= 0 ? 'Vencido' : days === 1 ? 'Vence manana' : `Vence en ${days} dias`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h2 className="font-bold text-gray-900">Pagos pendientes</h2>
            </div>
            <Link
              href="/dashboard/admin/subscriptions"
              className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingPayments.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No hay pagos pendientes
              </div>
            ) : (
              pendingPayments.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.restaurant_name}</p>
                    <p className="text-xs text-gray-500">{p.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">${p.amount.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart + Recent Restaurants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-gray-900">Ingresos mensuales</h2>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-end gap-2 h-40">
              {monthlyRevenue.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-gray-700">
                    {m.count > 0 ? m.count : ''}
                  </span>
                  <div
                    className="w-full bg-gradient-to-t from-purple-500 to-indigo-400 rounded-t-md transition-all"
                    style={{
                      height: `${Math.max((m.total / maxRevenue) * 100, m.total > 0 ? 8 : 2)}%`,
                      minHeight: m.total > 0 ? '12px' : '3px',
                    }}
                  />
                  <span className="text-xs text-gray-500 capitalize">{formatMonth(m.month)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">Total acumulado</span>
              <span className="font-bold text-gray-900">${stats.totalRevenue.toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        {/* Recent Restaurants */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-gray-900">Ultimos restaurantes</h2>
            </div>
            <Link
              href="/dashboard/restaurants"
              className="text-xs font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRestaurants.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.owner_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    r.plan === 'pro'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {r.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable stat card */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  color: 'purple' | 'blue' | 'green' | 'amber';
}) {
  const colors = {
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
  };
  const iconColors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}
