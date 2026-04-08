'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Lock } from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface CustomerEmail {
  id: string;
  email: string;
  name: string | null;
  registered_via: 'manual' | 'google';
  created_at: string;
}

export default function EmailsPage() {
  const { currentRestaurant } = useRestaurant();
  const [emails, setEmails] = useState<CustomerEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<CustomerEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('customer_emails')
          .select('*')
          .eq('restaurant_id', currentRestaurant.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setEmails(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError('Error al cargar los emails');
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, [currentRestaurant]);

  useEffect(() => {
    let filtered = emails;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEmails(filtered);
  }, [searchTerm, emails]);

  const handleExportCSV = () => {
    if (!emails.length) return;

    const headers = ['Email', 'Nombre', 'Método Registro', 'Fecha'];
    const rows = emails.map((e) => [
      e.email,
      e.name || '',
      'Email',
      new Date(e.created_at).toLocaleDateString('es-ES'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emails-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando emails...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Emails Recogidos</h1>
          <p className="text-gray-600 mt-2">
            Lista de clientes que compartieron su email
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Emails Totales</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{emails.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Plan Actual</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {currentRestaurant?.plan === 'pro' ? 'Pro - Ilimitado' : 'Free'}
          </p>
        </div>
      </div>

      {/* Free Plan Upgrade CTA */}
      {currentRestaurant?.plan === 'free' && emails.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Actualizá a Plan Pro
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                Con el Plan Pro tendrás acceso a más funciones y análisis detallados de tus clientes.
              </p>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold text-sm transition-all">
                Ver Planes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row gap-3 bg-white rounded-lg shadow-sm p-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={emails.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
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
                  Método
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map((email) => (
                <tr
                  key={email.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
        </div>

        {filteredEmails.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron emails' : 'No hay emails recogidos'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredEmails.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron emails' : 'No hay emails recogidos'}
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <div key={email.id} className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="text-sm font-mono text-gray-900">{email.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nombre</p>
                <p className="text-sm text-gray-700">{email.name || '-'}</p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600">Método</p>
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                    Email
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Fecha</p>
                  <p className="text-sm text-gray-600">
                    {new Date(email.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {filteredEmails.length} de {emails.length} emails
      </div>
    </div>
  );
}
