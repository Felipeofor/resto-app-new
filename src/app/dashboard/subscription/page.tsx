'use client';

import { useState, useEffect } from 'react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';
import {
  CreditCard,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Camera,
  ShoppingBag,
  BarChart3,
  Mail,
} from 'lucide-react';

interface SubscriptionPayment {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  transfer_receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
}

export default function SubscriptionPage() {
  const { currentRestaurant } = useRestaurant();
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ProfileData>({ full_name: '', email: '', phone: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [proPrice, setProPrice] = useState(5000);

  const isPro = currentRestaurant?.plan === 'pro';

  useEffect(() => {
    if (!currentRestaurant) return;
    fetchData();
  }, [currentRestaurant]);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch price from app_settings
    const { data: priceSetting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'pro_price')
      .single();
    if (priceSetting) {
      setProPrice(Number(priceSetting.value));
    }

    // Fetch profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();
      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
        });
      }
    }

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('restaurant_id', currentRestaurant!.id)
      .order('created_at', { ascending: false });

    setPayments(paymentsData || []);
    setLoading(false);
  };

  const handleSubmitPayment = async () => {
    if (!currentRestaurant || !receiptFile) {
      alert('Por favor subí el comprobante de transferencia');
      return;
    }
    if (!profile.full_name || !profile.email || !profile.phone) {
      alert('Por favor completá tus datos de perfil primero');
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save profile updates
      await supabase
        .from('profiles')
        .update({ full_name: profile.full_name, phone: profile.phone })
        .eq('id', user.id);

      // Upload receipt
      const fileName = `subscription-${currentRestaurant.id}-${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) {
        alert('Error al subir el comprobante');
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(uploadData.path);

      // Create payment record
      const { error } = await supabase.from('subscription_payments').insert({
        restaurant_id: currentRestaurant.id,
        user_id: user.id,
        amount: proPrice,
        transfer_receipt_url: urlData.publicUrl,
        status: 'pending' as const,
      });

      if (error) {
        console.error('Payment creation error:', error);
        alert('Error al registrar el pago');
      } else {
        setReceiptFile(null);
        setShowPaymentForm(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado');
    } finally {
      setUploading(false);
    }
  };

  const formattedPrice = `$${proPrice.toLocaleString('es-AR')}`;
  const hasPendingPayment = payments.some((p) => p.status === 'pending');

  const proFeatures = [
    { icon: Camera, label: 'Captura de menú con IA' },
    { icon: ShoppingBag, label: 'Sistema de pedidos y delivery' },
    { icon: BarChart3, label: 'Dashboard de métricas completo' },
    { icon: Mail, label: 'Captura de emails + bienvenida automática' },
    { icon: Upload, label: 'Fotos de productos ilimitadas' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suscripción</h1>
        <p className="text-gray-600 mt-1">
          Gestioná tu plan y accedé a todas las funcionalidades.
        </p>
      </div>

      {/* Current plan */}
      <div className={`rounded-2xl p-6 border-2 ${isPro ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isPro ? (
                <Star className="w-5 h-5 text-yellow-500" />
              ) : (
                <CreditCard className="w-5 h-5 text-gray-400" />
              )}
              <h2 className="text-xl font-bold text-gray-900">
                Plan {isPro ? 'Pro' : 'Gratuito'}
              </h2>
            </div>
            <p className="text-gray-600 mt-1">
              {isPro
                ? 'Tenés acceso a todas las funcionalidades.'
                : 'Tenés acceso al menú digital y QR. Actualizá a Pro para desbloquear todo.'}
            </p>
          </div>
          {isPro && (
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formattedPrice}</p>
              <p className="text-sm text-gray-500">/mes</p>
            </div>
          )}
        </div>
      </div>

      {/* Pro features (show when free) */}
      {!isPro && (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-300" />
            <h3 className="text-lg font-bold">Plan Pro - {formattedPrice}/mes</h3>
          </div>
          <p className="text-purple-100 mb-4">
            Desbloqueá todas las funcionalidades para tu restaurante:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {proFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <f.icon className="w-4 h-4 text-purple-200" />
                <span className="text-sm text-purple-100">{f.label}</span>
              </div>
            ))}
          </div>

          {hasPendingPayment ? (
            <div className="bg-yellow-400/20 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-300" />
              <p className="text-sm text-yellow-100">
                Tu pago está pendiente de aprobación. Te avisaremos cuando sea revisado.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors"
            >
              Actualizar a Pro
            </button>
          )}
        </div>
      )}

      {/* Payment form */}
      {showPaymentForm && !isPro && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Datos para la transferencia</h3>

          {/* Profile fields */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Tus datos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Transfer details */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-blue-900">Datos de transferencia</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600">Alias:</span>{' '}
                <span className="font-mono font-semibold text-blue-900">felipe..36</span>
              </div>
              <div>
                <span className="text-blue-600">Titular:</span>{' '}
                <span className="font-semibold text-blue-900">Ramos Felipe Omar</span>
              </div>
            </div>
            <p className="text-blue-700 text-sm mt-2">
              Monto: <span className="font-bold">{formattedPrice}</span> (mensual)
            </p>
          </div>

          {/* Receipt upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comprobante de transferencia *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
              {receiptFile ? (
                <div className="space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-sm text-gray-700 font-medium">{receiptFile.name}</p>
                  <button
                    onClick={() => setReceiptFile(null)}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Cambiar archivo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Hacé click para subir el comprobante
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG o PDF</p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmitPayment}
              disabled={uploading || !receiptFile}
              className="flex-1 bg-purple-600 text-white font-semibold py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Enviando...' : 'Enviar comprobante'}
            </button>
            <button
              onClick={() => {
                setShowPaymentForm(false);
                setReceiptFile(null);
              }}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Historial de pagos</h3>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  {payment.status === 'pending' && (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  {payment.status === 'approved' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {payment.status === 'rejected' && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      ${payment.amount.toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {payment.notes && (
                    <p className="text-xs text-gray-500 max-w-[200px] truncate">{payment.notes}</p>
                  )}
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
