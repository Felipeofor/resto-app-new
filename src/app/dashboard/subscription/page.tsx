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
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);

  const isPro = currentRestaurant?.plan === 'pro';
  const annualPrice = proPrice * 10;

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

    // Fetch expiry date
    const { data: restoData } = await supabase
      .from('restaurants')
      .select('pro_expires_at' as any)
      .eq('id', currentRestaurant!.id)
      .single() as any;
    if (restoData?.pro_expires_at) {
      setProExpiresAt(restoData.pro_expires_at);
    }

    setLoading(false);
  };

  const handleSubmitPayment = async () => {
    setFormError(null);
    if (!currentRestaurant || !receiptFile) {
      setFormError('Por favor subí el comprobante de transferencia');
      return;
    }
    if (!profile.full_name || !profile.email || !profile.phone) {
      setFormError('Por favor completá tus datos de perfil primero');
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
      const fileExt = receiptFile.name.split('.').pop() || 'png';
      const fileName = `subscription-${currentRestaurant.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) {
        setFormError('Error al subir el comprobante');
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(uploadData.path);

      // Create payment record
      const paymentAmount = selectedPlan === 'annual' ? annualPrice : proPrice;
      const { error } = await supabase.from('subscription_payments').insert({
        restaurant_id: currentRestaurant.id,
        user_id: user.id,
        amount: paymentAmount,
        transfer_receipt_url: urlData.publicUrl,
        status: 'pending' as const,
        notes: selectedPlan === 'annual' ? 'Plan anual' : 'Plan mensual',
      } as any);

      if (error) {
        console.error('Payment creation error:', error);
        setFormError('Error al registrar el pago');
      } else {
        setReceiptFile(null);
        setShowPaymentForm(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setFormError('Error inesperado');
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          {isPro && proExpiresAt && (() => {
            const days = Math.ceil((new Date(proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = days <= 0;
            const isUrgent = days > 0 && days <= 5;
            return (
              <div className={`rounded-xl px-4 py-3 text-center flex-shrink-0 ${
                isExpired
                  ? 'bg-red-100 border border-red-300'
                  : isUrgent
                    ? 'bg-orange-100 border border-orange-300'
                    : 'bg-green-100 border border-green-300'
              }`}>
                <p className={`text-2xl font-bold ${
                  isExpired ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {isExpired ? 'Vencido' : `${days} dias`}
                </p>
                <p className={`text-xs font-medium ${
                  isExpired ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {isExpired
                    ? 'Renova tu plan para no perder acceso'
                    : `Vence el ${new Date(proExpiresAt).toLocaleDateString('es-AR')}`}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Pro features + plan selector (show when free or renewing) */}
      {(!isPro || (proExpiresAt && Math.ceil((new Date(proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 5)) && (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-300" />
            <h3 className="text-lg font-bold">
              {isPro ? 'Renova tu Plan Pro' : 'Actualizá a Pro'}
            </h3>
          </div>
          <p className="text-purple-100 mb-4">
            {isPro
              ? 'Tu plan está por vencer. Renová para no perder acceso:'
              : 'Desbloqueá todas las funcionalidades para tu restaurante:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {proFeatures.map((f) => (
              <div key={f.label} className="flex items-center gap-2">
                <f.icon className="w-4 h-4 text-purple-200" />
                <span className="text-sm text-purple-100">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Plan selector: Monthly vs Annual */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedPlan('monthly')}
              className={`relative rounded-xl p-4 border-2 transition-all text-left ${
                selectedPlan === 'monthly'
                  ? 'border-yellow-400 bg-white/15'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <p className="font-bold text-lg">{formattedPrice}</p>
              <p className="text-sm text-purple-200">Mensual</p>
              <p className="text-xs text-purple-300 mt-1">30 dias de acceso</p>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan('annual')}
              className={`relative rounded-xl p-4 border-2 transition-all text-left ${
                selectedPlan === 'annual'
                  ? 'border-yellow-400 bg-white/15'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="absolute -top-2.5 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                2 meses gratis
              </div>
              <p className="font-bold text-lg">${annualPrice.toLocaleString('es-AR')}</p>
              <p className="text-sm text-purple-200">Anual</p>
              <p className="text-xs text-purple-300 mt-1">365 dias de acceso</p>
            </button>
          </div>

          {hasPendingPayment ? (
            <div className="bg-yellow-400/20 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-300" />
              <p className="text-sm text-yellow-100">
                Tu pago esta pendiente de aprobacion. Te avisaremos cuando sea revisado.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors"
            >
              {isPro ? 'Renovar plan' : 'Actualizar a Pro'}
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
              Monto: <span className="font-bold">
                ${(selectedPlan === 'annual' ? annualPrice : proPrice).toLocaleString('es-AR')}
              </span> ({selectedPlan === 'annual' ? 'anual - 365 dias' : 'mensual - 30 dias'})
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

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{formError}</p>
            </div>
          )}

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
      {/* Soluciones a Medida */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold">Soluciones a Medida</h3>
            <p className="text-gray-400 mt-1 text-sm">
              Llevamos tu restaurante al siguiente nivel con desarrollo personalizado
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            {
              title: 'Tienda Virtual',
              desc: 'E-commerce completo con carrito, pagos online y delivery integrado',
              icon: '🛒',
            },
            {
              title: 'Seguimiento en Tiempo Real',
              desc: 'Tus clientes ven el estado de su pedido en vivo, desde la cocina hasta la entrega',
              icon: '📍',
            },
            {
              title: 'Gestion de Mesas',
              desc: 'Reservas online, mapa interactivo de mesas y turnos automatizados',
              icon: '🪑',
            },
            {
              title: 'App Propia del Restaurante',
              desc: 'Aplicacion movil con tu marca, notificaciones push y programa de fidelidad',
              icon: '📱',
            },
            {
              title: 'Sistema de Facturacion',
              desc: 'Facturacion electronica integrada con AFIP y reportes contables',
              icon: '🧾',
            },
            {
              title: 'Marketing Automatizado',
              desc: 'Campanas de email y WhatsApp segmentadas con ofertas personalizadas',
              icon: '📣',
            },
          ].map((solution) => (
            <div
              key={solution.title}
              className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{solution.icon}</span>
                <h4 className="font-semibold text-white">{solution.title}</h4>
              </div>
              <p className="text-sm text-gray-400">{solution.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <p className="text-sm text-gray-300 mb-4">
            Cada solucion se desarrolla a medida para tu restaurante. Contactanos para recibir una propuesta personalizada sin compromiso.
          </p>
          <a
            href="https://wa.me/5491112345678?text=Hola!%20Me%20interesa%20una%20solucion%20a%20medida%20para%20mi%20restaurante"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.913.913l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.599-.798-6.375-2.144l-.447-.338-2.828.948.948-2.828-.338-.447A9.953 9.953 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
            </svg>
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
