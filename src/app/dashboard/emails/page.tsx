'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Lock } from 'lucide-react';

interface CustomerEmail {
  id: string;
  email: string;
  name: string | null;
  registered_via: 'manual' | 'google';
  created_at: string;
}

interface PlanInfo {
  plan: 'free' | 'pro';
  emailCount: number;
  maxEmails: number | null;
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<CustomerEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<CustomerEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock plan info
    const mockPlanInfo: PlanInfo = {
      plan: 'free',
      emailCount: 15,
      maxEmails: null, // unlimited for pro
    };
    setPlanInfo(mockPlanInfo);

    // Mock emails - only show first 5 if free plan
    const mockEmails: CustomerEmail[] = [
      {
        id: '1',
        email: 'customer1@example.com',
        name: 'Juan García',
        registered_via: 'manual',
        created_at: '2024-04-05T10:30:00',
      },
      {
        id: '2',
        email: 'customer2@example.com',
        name: 'María López',
        registered_via: 'google',
        created_at: '2024-04-05T09:15:00',
      },
      {
        id: '3',
        email: 'customer3@example.com',
        name: 'Carlos Rodríguez',
        registered_via: 'manual',
        created_at: '2024-04-04T18:45:00',
      },
      {
        id: '4',
        email: 'customer4@example.com',
        name: 'Ana Martínez',
        registered_via: 'google',
        created_at: '2024-04-04T15:20:00',
      },
      {
        id: '5',
        email: 'customer5@example.com',
        name: 'Pedro Sánchez',
        registered_via: 'manual',
        created_at: '2024-04-03T12:00:00',
      },
      {
        id: '6',
        email: 'customer6@example.com',
        name: 'Laura González',
        registered_via: 'google',
        created_at: '2024-04-02T14:30:00',
      },
      {
        id: '7',
        email: 'customer7@example.com',
        name: 'Miguel Torres',
        registered_via: 'manual',
        created_at: '2024-04-01T11:00:00',
      },
      {
        id: '8',
        email: 'customer8@example.com',
        name: 'Sofia Flores',
        registered_via: 'google',
        created_at: '2024-03-31T16:45:00',
      },
      {
        id: '9',
        email: 'customer9@example.com',
        name: 'Diego Reyes',
        registered_via: 'manual',
        created_at: '2024-03-30T09:30:00',
      },
      {
        id: '10',
        email: 'customer10@example.com',
        name: 'Valentina Silva',
        registered_via: 'google',
        created_at: '2024-03-29T13:15:00',
      },
      {
        id: '11',
        email: 'customer11@example.com',
        name: 'Roberto Díaz',
        registered_via: 'manual',
        created_at: '2024-03-28T10:00:00',
      },
      {
        id: '12',
        email: 'customer12@example.com',
        name: 'Claudia Morales',
        registered_via: 'google',
        created_at: '2024-03-27T15:45:00',
      },
      {
        id: '13',
        email: 'customer13@example.com',
        name: 'Fernando Castro',
        registered_via: 'manual',
        created_at: '2024-03-26T12:30:00',
      },
      {
        id: '14',
        email: 'customer14@example.com',
        name: 'Gabriela López',
        registered_via: 'google',
        created_at: '2024-03-25T11:00:00',
      },
      {
        id: '15',
        email: 'customer15@example.com',
        name: 'Antonio Ruiz',
        registered_via: 'manual',
        created_at: '2024-03-24T14:20:00',
      },
    ];

    setEmails(mockEmails);
    setFilteredEmails(mockEmails);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = emails;

    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // For free plan, only show first 5
    if (planInfo?.plan === 'free') {
      filtered = filtered.slice(0, 5);
    }

    setFilteredEmails(filtered);
  }, [searchTerm, emails, planInfo]);

  const handleExportCSV = () => {
    if (!filteredEmails.length) return;

    const headers = ['Email', 'Nombre', 'Método Registro', 'Fecha'];
    const rows = filteredEmails.map((e) => [
      e.email,
      e.name || '',
      e.registered_via === 'google' ? 'Google' : 'Manual',
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

  const isFreeWithMoreEmails = planInfo?.plan === 'free' && emails.length > 5;

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
          <p className="text-gray-600 text-sm font-medium">
            {planInfo?.plan === 'free' ? 'Emails Visibles' : 'Plan Actual'}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {planInfo?.plan === 'free' ? '5 / 15' : 'Pro - Ilimitado'}
          </p>
        </div>
      </div>

      {/* Free Plan Upgrade CTA */}
      {isFreeWithMoreEmails && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Upgrade a Plan Pro para ver todos los emails
              </h3>
              <p className="text-sm text-amber-800 mb-4">
                Actualmente solo ves los primeros 5 de {emails.length} emails recogidos.
                Con el Plan Pro tendrás acceso a todos ellos y más funciones.
              </p>
              <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-semibold text-sm transition-all">
                Ver Planes
              </button>
            </div>
          </div>
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
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-all font-semibold whitespace-nowrap"
        >
          <Download className="w-5 h-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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

      {/* Results Info */}
      <div className="text-sm text-gray-600 text-center">
        Mostrando {filteredEmails.length}
        {isFreeWithMoreEmails ? ` de ${emails.length}` : ''} emails
      </div>
    </div>
  );
}
