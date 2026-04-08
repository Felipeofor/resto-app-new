'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, QrCode, Mail } from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface MetricsData {
  totalVisits: number;
  qrScans: number;
  emailsThisMonth: number;
  dailyVisits: Array<{ date: string; count: number }>;
  dailyScans: Array<{ date: string; count: number }>;
}

export default function MetricsPage() {
  const { currentRestaurant } = useRestaurant();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const { data: events, error: fetchError } = await supabase
          .from('analytics_events')
          .select('event_type, created_at')
          .eq('restaurant_id', currentRestaurant.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (fetchError) throw fetchError;

        const eventsByType: { [key: string]: number } = {
          visit: 0,
          qr_scan: 0,
          email_register: 0,
        };

        const dailyData: { [key: string]: { visits: number; scans: number } } = {};

        (events || []).forEach((event: any) => {
          const eventType = event.event_type;
          if (eventType in eventsByType) {
            eventsByType[eventType]++;
          }

          const date = new Date(event.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          if (!dailyData[date]) {
            dailyData[date] = { visits: 0, scans: 0 };
          }

          if (eventType === 'visit') dailyData[date].visits++;
          if (eventType === 'qr_scan') dailyData[date].scans++;
        });

        const emailsThisMonth = (events || []).filter((e: any) => {
          const eventDate = new Date(e.created_at);
          return eventDate >= monthStart && e.event_type === 'email_register';
        }).length;

        const dailyVisits = Object.entries(dailyData).map(([date, data]) => ({
          date,
          count: data.visits,
        }));

        const dailyScans = Object.entries(dailyData).map(([date, data]) => ({
          date,
          count: data.scans,
        }));

        setMetrics({
          totalVisits: eventsByType.visit,
          qrScans: eventsByType.qr_scan,
          emailsThisMonth,
          dailyVisits,
          dailyScans,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Error al cargar las métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [currentRestaurant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando métricas...</div>
      </div>
    );
  }

  const isFreePlan = currentRestaurant?.plan === 'free';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Métricas</h1>
        <p className="text-gray-600 mt-2">
          Análisis de visitas y engagement de tu menú digital
        </p>
      </div>

      {/* Free Plan Upgrade CTA */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Actualizá a Plan Pro
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                Con el Plan Pro tendrás acceso a gráficos interactivos y análisis detallados de tus métricas.
              </p>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold text-sm transition-all">
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Basic Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Visits */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Visitas Totales (30d)</p>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.totalVisits || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* QR Scans */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Escaneos QR (30d)</p>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.qrScans || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Emails This Month */}
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Emails Este Mes</p>
              <div className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.emailsThisMonth || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {isFreePlan ? (
        <div className="bg-white rounded-lg shadow-sm p-8 relative">
          <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Gráficos Detallados - Plan Pro</h3>
              <p className="text-sm text-gray-600 mb-4 max-w-xs">
                Actualizá a Plan Pro para ver gráficos y análisis detallados de tus métricas
              </p>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-semibold text-sm transition-all">
                Actualizar Ahora
              </button>
            </div>
          </div>

          <div className="opacity-50 pointer-events-none">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Visitas (Últimos 30 días)</h2>
                <BarChart
                  data={metrics?.dailyVisits || []}
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Escaneos QR (Últimos 30 días)</h2>
                <BarChart
                  data={metrics?.dailyScans || []}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Visits Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Visitas (Últimos 30 días)</h2>
            <BarChart
              data={metrics?.dailyVisits || []}
            />
          </div>

          {/* QR Scans Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Escaneos QR (Últimos 30 días)</h2>
            <BarChart
              data={metrics?.dailyScans || []}
            />
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-blue-900 mb-2">Cómo se recopilan estas métricas</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex items-center space-x-2">
            <span>•</span>
            <span>
              <strong>Visitas:</strong> Se cuenta cada vez que alguien abre tu menú
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <span>•</span>
            <span>
              <strong>Escaneos QR:</strong> Se registra cuando alguien escanea tu código QR
            </span>
          </li>
          <li className="flex items-center space-x-2">
            <span>•</span>
            <span>
              <strong>Emails:</strong> Se cuenta cada nuevo email registrado
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function BarChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 240;

  return (
    <div className="flex items-end gap-1 h-80 p-4 bg-gray-50 rounded-lg overflow-x-auto">
      {data.map((item, idx) => {
        const height = (item.count / maxCount) * chartHeight;
        return (
          <div
            key={idx}
            className="flex-1 min-w-[20px] bg-gradient-to-t from-green-400 to-green-500 rounded-t hover:from-green-500 hover:to-green-600 transition-all relative group"
            style={{ height: `${height}px` }}
          >
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {item.count}
              <span className="text-xs"> ({item.date})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple Line Chart Component
function LineChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 200;

  return (
    <div className="flex items-end gap-1 h-64 p-4 bg-gray-50 rounded-lg overflow-x-auto">
      {data.map((item, idx) => {
        const height = (item.count / maxCount) * chartHeight;
        return (
          <div
            key={idx}
            className="flex-1 min-w-[12px] bg-gradient-to-t from-purple-400 to-purple-500 rounded-t hover:from-purple-500 hover:to-purple-600 transition-all relative group"
            style={{ height: `${height}px` }}
          >
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {item.count}
              <span className="text-xs"> ({item.date})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

