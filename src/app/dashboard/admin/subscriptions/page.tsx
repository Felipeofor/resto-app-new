'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  Store,
  User,
  Settings,
  Save,
} from 'lucide-react';

interface PaymentWithDetails {
  id: string;
  restaurant_id: string;
  user_id: string;
  amount: number;
  transfer_receipt_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  restaurant_name: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
}

export default function AdminSubscriptionsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Price config
  const [proPrice, setProPrice] = useState('5000');
  const [priceEditing, setPriceEditing] = useState(false);
  const [priceSaving, setPriceSaving] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchPrice();
  }, []);

  const fetchPrice = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pro_price')
      .single();
    if (data) {
      setProPrice(data.value);
    }
  };

  const savePrice = async () => {
    const numPrice = parseInt(proPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      alert('Ingresá un precio válido');
      return;
    }
    setPriceSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('app_settings')
      .update({ value: String(numPrice) })
      .eq('key', 'pro_price');

    if (error) {
      // If row doesn't exist, try insert
      await supabase.from('app_settings').upsert({
        key: 'pro_price',
        value: String(numPrice),
      });
    }
    setPriceSaving(false);
    setPriceEditing(false);
  };

  const fetchPayments = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        restaurants:restaurant_id (name),
        profiles:user_id (full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped: PaymentWithDetails[] = data.map((p: any) => ({
        id: p.id,
        restaurant_id: p.restaurant_id,
        user_id: p.user_id,
        amount: p.amount,
        transfer_receipt_url: p.transfer_receipt_url,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at,
        restaurant_name: p.restaurants?.name || 'Desconocido',
        user_name: p.profiles?.full_name || 'Sin nombre',
        user_email: p.profiles?.email || '',
        user_phone: p.profiles?.phone || null,
      }));
      setPayments(mapped);
    }
    setLoading(false);
  };

  const handleApprove = async (paymentId: string, restaurantId: string) => {
    setProcessingId(paymentId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('subscription_payments')
      .update({
        status: 'approved' as const,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase
      .from('restaurants')
      .update({
        plan: 'pro' as const,
        pro_started_at: now.toISOString(),
        pro_expires_at: expiresAt.toISOString(),
      })
      .eq('id', restaurantId);

    setProcessingId(null);
    fetchPayments();
  };

  const handleReject = async (paymentId: string) => {
    setProcessingId(paymentId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('subscription_payments')
      .update({
        status: 'rejected' as const,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        notes: rejectNotes || null,
      })
      .eq('id', paymentId);

    setProcessingId(null);
    setShowRejectModal(null);
    setRejectNotes('');
    fetchPayments();
  };

  const filteredPayments =
    filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Suscripciones</h1>
        <p className="text-gray-600 mt-1">
          Revisá y aprobá los pagos de suscripción Pro.
        </p>
      </div>

      {/* Price configuration */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Precio del Plan Pro</h3>
              <p className="text-sm text-gray-500">Este es el precio que ven los restaurantes al suscribirse.</p>
            </div>
          </div>
          {priceEditing ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-gray-500 font-medium">$</span>
                <input
                  type="number"
                  value={proPrice}
                  onChange={(e) => setProPrice(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                  min="1"
                />
              </div>
              <button
                onClick={savePrice}
                disabled={priceSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {priceSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setPriceEditing(false);
                  fetchPrice();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">
                ${Number(proPrice).toLocaleString('es-AR')}
              </span>
              <span className="text-gray-500">/mes</span>
              <button
                onClick={() => setPriceEditing(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Editar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CreditCard className="w-4 h-4" />
            Total pagos
          </div>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
            <Clock className="w-4 h-4" />
            Pendientes
          </div>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Aprobados
          </div>
          <p className="text-2xl font-bold text-green-700">
            {payments.filter((p) => p.status === 'approved').length}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <XCircle className="w-4 h-4" />
            Rechazados
          </div>
          <p className="text-2xl font-bold text-red-700">
            {payments.filter((p) => p.status === 'rejected').length}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all'
              ? 'Todos'
              : f === 'pending'
                ? `Pendientes (${pendingCount})`
                : f === 'approved'
                  ? 'Aprobados'
                  : 'Rechazados'}
          </button>
        ))}
      </div>

      {/* Payments list */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay pagos {filter !== 'all' ? 'en esta categoría' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-purple-500" />
                    <span className="font-bold text-gray-900">{payment.restaurant_name}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : payment.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {payment.status === 'pending'
                        ? 'Pendiente'
                        : payment.status === 'approved'
                          ? 'Aprobado'
                          : 'Rechazado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {payment.user_name} ({payment.user_email})
                    </div>
                    {payment.user_phone && (
                      <span>Tel: {payment.user_phone}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(payment.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${payment.amount.toLocaleString('es-AR')}
                </p>
              </div>

              {/* Receipt */}
              {payment.transfer_receipt_url && (
                <div>
                  {viewingReceipt === payment.id ? (
                    <div className="space-y-2">
                      <img
                        src={payment.transfer_receipt_url}
                        alt="Comprobante"
                        className="max-w-md rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setViewingReceipt(null)}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Ocultar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setViewingReceipt(payment.id)}
                      className="flex items-center gap-1.5 text-sm text-purple-600 hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      Ver comprobante
                    </button>
                  )}
                </div>
              )}

              {payment.notes && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <span className="font-medium">Nota:</span> {payment.notes}
                </p>
              )}

              {/* Actions */}
              {payment.status === 'pending' && (
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(payment.id, payment.restaurant_id)}
                    disabled={processingId === payment.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar y activar Pro
                  </button>
                  <button
                    onClick={() => setShowRejectModal(payment.id)}
                    disabled={processingId === payment.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Rechazar pago</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo del rechazo (opcional)
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                placeholder="Ej: Comprobante ilegible, monto incorrecto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(showRejectModal)}
                className="flex-1 bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Confirmar rechazo
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
