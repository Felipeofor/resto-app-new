'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Phone,
  MapPin,
  AtSign,
  Mail,
  MessageCircle,
  Edit3,
  Trash2,
  Filter,
  Users,
  UserCheck,
  UserX,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ------ Types ------------------------------------------------------------------------------------------------------------------------------------------------ */
type ProspectStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'discarded';
type ProspectSource = 'google_maps' | 'instagram' | 'referral' | 'event' | 'delivery_app' | 'other';

interface Prospect {
  id: string;
  restaurant_name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  address: string | null;
  city: string | null;
  status: ProspectStatus;
  source: ProspectSource;
  notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  new: { label: 'Nuevo', color: 'text-blue-700', bg: 'bg-blue-100', icon: Star },
  contacted: { label: 'Contactado', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Phone },
  interested: { label: 'Interesado', color: 'text-purple-700', bg: 'bg-purple-100', icon: UserCheck },
  converted: { label: 'Convertido', color: 'text-green-700', bg: 'bg-green-100', icon: Users },
  discarded: { label: 'Descartado', color: 'text-gray-500', bg: 'bg-gray-100', icon: UserX },
};

const SOURCE_LABELS: Record<ProspectSource, string> = {
  google_maps: 'Google Maps',
  instagram: 'Instagram',
  referral: 'Referido',
  event: 'Evento',
  delivery_app: 'App Delivery',
  other: 'Otro',
};

const WHATSAPP_TEMPLATE = `Hola! 👋 Soy de *RestoQR*. Vi tu restaurante y quería mostrarte nuestra plataforma de menú digital con QR, pedidos online y más. Te puedo contar en 2 minutos, te parece?`;

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Prospects CRM Page
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProspectStatus | 'all'>('all');
  const [filterSource, setFilterSource] = useState<ProspectSource | 'all'>('all');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [form, setForm] = useState({
    restaurant_name: '',
    owner_name: '',
    phone: '',
    email: '',
    instagram: '',
    address: '',
    city: '',
    status: 'new' as ProspectStatus,
    source: 'other' as ProspectSource,
    notes: '',
    next_followup_at: '',
  });

  // Expanded notes
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await (supabase
      .from('prospects' as any)
      .select('*')
      .order('created_at', { ascending: false }) as any);
    setProspects(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({
      restaurant_name: '', owner_name: '', phone: '', email: '',
      instagram: '', address: '', city: '', status: 'new',
      source: 'other', notes: '', next_followup_at: '',
    });
    setEditing(null);
  };

  const openEdit = (p: Prospect) => {
    setForm({
      restaurant_name: p.restaurant_name,
      owner_name: p.owner_name || '',
      phone: p.phone || '',
      email: p.email || '',
      instagram: p.instagram || '',
      address: p.address || '',
      city: p.city || '',
      status: p.status,
      source: p.source,
      notes: p.notes || '',
      next_followup_at: p.next_followup_at || '',
    });
    setEditing(p);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant_name) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload: any = {
      restaurant_name: form.restaurant_name,
      owner_name: form.owner_name || null,
      phone: form.phone || null,
      email: form.email || null,
      instagram: form.instagram || null,
      address: form.address || null,
      city: form.city || null,
      status: form.status,
      source: form.source,
      notes: form.notes || null,
      next_followup_at: form.next_followup_at || null,
    };

    if (editing) {
      await (supabase.from('prospects' as any).update(payload).eq('id', editing.id) as any);
    } else {
      payload.created_by = user?.id;
      await (supabase.from('prospects' as any).insert(payload) as any);
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    fetchProspects();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await (supabase.from('prospects' as any).delete().eq('id', id) as any);
    setProspects(prev => prev.filter(p => p.id !== id));
  };

  const handleStatusChange = async (id: string, status: ProspectStatus) => {
    const supabase = createClient();
    const update: any = { status };
    if (status === 'contacted') {
      update.last_contacted_at = new Date().toISOString();
    }
    await (supabase.from('prospects' as any).update(update).eq('id', id) as any);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
  };

  const getWhatsAppUrl = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    // Argentine numbers: strip leading 0 and prepend 54
    if (clean.startsWith('0')) {
      clean = '54' + clean.slice(1);
    } else if (!clean.startsWith('54')) {
      clean = '54' + clean;
    }
    const msg = WHATSAPP_TEMPLATE.replace('tu restaurante', name);
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  // Filters
  const filtered = useMemo(() => {
    let result = prospects;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.restaurant_name.toLowerCase().includes(term) ||
        p.owner_name?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.phone?.includes(term)
      );
    }
    if (filterStatus !== 'all') result = result.filter(p => p.status === filterStatus);
    if (filterSource !== 'all') result = result.filter(p => p.source === filterSource);
    return result;
  }, [prospects, searchTerm, filterStatus, filterSource]);

  // Stats
  const stats = useMemo(() => ({
    total: prospects.length,
    new: prospects.filter(p => p.status === 'new').length,
    contacted: prospects.filter(p => p.status === 'contacted').length,
    interested: prospects.filter(p => p.status === 'interested').length,
    converted: prospects.filter(p => p.status === 'converted').length,
    conversionRate: prospects.length > 0
      ? ((prospects.filter(p => p.status === 'converted').length / prospects.length) * 100).toFixed(1)
      : '0',
  }), [prospects]);

  // Followups due today or overdue
  const pendingFollowups = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return prospects.filter(p => p.next_followup_at && p.next_followup_at <= today && p.status !== 'converted' && p.status !== 'discarded');
  }, [prospects]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Cargando prospectos...</div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prospectos</h1>
          <p className="text-gray-500 text-sm mt-1">CRM de restaurantes potenciales</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo prospecto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
          <p className="text-xs text-blue-600">Nuevos</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{stats.contacted}</p>
          <p className="text-xs text-yellow-600">Contactados</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{stats.interested}</p>
          <p className="text-xs text-purple-600">Interesados</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.converted}</p>
          <p className="text-xs text-green-600">Convertidos</p>
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
          <p className="text-xs text-gray-500">Conversion</p>
        </div>
      </div>

      {/* Pending followups alert */}
      {pendingFollowups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              {pendingFollowups.length} seguimiento{pendingFollowups.length > 1 ? 's' : ''} pendiente{pendingFollowups.length > 1 ? 's' : ''}
            </p>
            <div className="mt-1 space-y-1">
              {pendingFollowups.slice(0, 3).map(p => (
                <p key={p.id} className="text-xs text-amber-700">
                  {p.restaurant_name} {p.phone ? `· ${p.phone}` : ''}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, dueno, ciudad o telefono..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value as any)}
            className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todas las fuentes</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Prospects list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No hay prospectos{filterStatus !== 'all' || searchTerm ? ' con estos filtros' : ''}</p>
          <p className="text-sm text-gray-400 mt-1">Agrega tu primer prospecto para empezar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const sc = STATUS_CONFIG[p.status];
            const isExpanded = expandedId === p.id;
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 flex items-start gap-4">
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                    <sc.icon className={`w-5 h-5 ${sc.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{p.restaurant_name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      <span className="text-xs text-gray-400">{SOURCE_LABELS[p.source]}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                      {p.owner_name && <span>{p.owner_name}</span>}
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />{p.phone}
                        </span>
                      )}
                      {p.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{p.city}
                        </span>
                      )}
                      {p.instagram && (
                        <span className="flex items-center gap-1">
                          <AtSign className="w-3 h-3" />@{p.instagram.replace('@', '')}
                        </span>
                      )}
                    </div>
                    {p.next_followup_at && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Seguimiento: {new Date(p.next_followup_at + 'T12:00:00').toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {p.phone && (
                      <a
                        href={getWhatsAppUrl(p.phone, p.restaurant_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { if (p.status === 'new') handleStatusChange(p.id, 'contacted'); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Editar">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
                    {p.address && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Direccion:</span> {p.address}</p>
                    )}
                    {p.email && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {p.email}</p>
                    )}
                    {p.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.notes}</p>
                      </div>
                    )}
                    {p.last_contacted_at && (
                      <p className="text-xs text-gray-400">
                        Ultimo contacto: {new Date(p.last_contacted_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    {/* Quick status change */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(Object.keys(STATUS_CONFIG) as ProspectStatus[])
                        .filter(s => s !== p.status)
                        .map(s => {
                          const cfg = STATUS_CONFIG[s];
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(p.id, s)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${cfg.bg} ${cfg.color} border-transparent hover:border-current`}
                            >
                              Marcar como {cfg.label.toLowerCase()}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-sm text-gray-400 text-center">
        Mostrando {filtered.length} de {prospects.length} prospectos
      </p>

      {/* ------ Form modal --------------------------------------------------------------------------------------------------------- */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar prospecto' : 'Nuevo prospecto'}
              </h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Restaurant name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del restaurante *</label>
                <input
                  type="text"
                  value={form.restaurant_name}
                  onChange={e => setForm({ ...form, restaurant_name: e.target.value })}
                  required
                  placeholder="Ej: La Parrilla de Juan"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Owner + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dueno / Contacto</label>
                  <input
                    type="text"
                    value={form.owner_name}
                    onChange={e => setForm({ ...form, owner_name: e.target.value })}
                    placeholder="Juan Perez"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefono (WhatsApp)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Email + Instagram */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="juan@correo.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={e => setForm({ ...form, instagram: e.target.value })}
                    placeholder="@laparrilla"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Address + City */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Av. Corrientes 1234"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="CABA"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Source + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
                  <select
                    value={form.source}
                    onChange={e => setForm({ ...form, source: e.target.value as ProspectSource })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as ProspectStatus })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Next followup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proximo seguimiento</label>
                <input
                  type="date"
                  value={form.next_followup_at}
                  onChange={e => setForm({ ...form, next_followup_at: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Ej: Tiene menu en papel, le intereso el QR. Volver a llamar el jueves."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear prospecto'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
