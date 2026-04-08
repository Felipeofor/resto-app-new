'use client';

import { useState } from 'react';
import { useCart } from '@/lib/context/cart-context';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Banknote,
  Building2,
  Upload,
  MessageCircle,
  CheckCircle,
  ArrowLeft,
  Copy,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Step = 'info' | 'payment' | 'confirmation';
type PaymentMethod = 'cash' | 'transfer' | null;

interface CustomerInfo {
  fullName: string;
  email: string;
  whatsapp: string;
  address: string;
  notes: string;
}

export default function CheckoutPage({
  params,
}: {
  params: { slug: string };
}) {
  const { items, getTotal, restaurantId, restaurantSlug } = useCart();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fullName: '',
    email: '',
    whatsapp: '+54 ',
    address: '',
    notes: '',
  });

  const subtotal = getTotal();
  const deliveryFee = 0; // Configurar según restaurante
  const total = subtotal + deliveryFee;

  // Redirect if no items
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-6">
            Agrega algunos platos antes de proceder
          </p>
          <Link
            href={`/menu/${restaurantSlug || params.slug}`}
            className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    );
  }

  const handleCustomerInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const validateCustomerInfo = (): boolean => {
    if (!customerInfo.fullName.trim()) return false;
    if (!customerInfo.whatsapp.trim() || customerInfo.whatsapp === '+54 ') return false;
    if (!customerInfo.address.trim()) return false;
    return true;
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setCurrentStep('confirmation');
  };

  const handleWhatsAppOrder = async () => {
    // Para efectivo (pago contra-entrega u otros donde no se carga comprobante manual aquí)
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('customerInfo', JSON.stringify(customerInfo));
      formData.append('items', JSON.stringify(items));
      formData.append('paymentMethod', 'cash');
      formData.append('restaurantId', restaurantId || '');
      formData.append('total', total.toString());
      formData.append('subtotal', subtotal.toString());
      formData.append('deliveryFee', deliveryFee.toString());

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al crear el pedido');
      const data = await response.json();

      setSuccess(true);
      setOrderNumber(data.orderNumber);

      if (data.whatsappNumber) {
        const orderSummary = items
          .map((item) => `• ${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`)
          .join('\n');

        const message = `Hola! Quiero hacer un pedido:\n\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\n\nDirección: ${customerInfo.address}\nNombre: ${customerInfo.fullName}${customerInfo.notes ? `\nNotas: ${customerInfo.notes}` : ''}\nNº de Pedido: ${data.orderNumber}`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappPhone = data.whatsappNumber.replace(/\s+/g, '');
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmTransferOrder = async () => {
    if (!receiptFile) {
      alert('Por favor sube el comprobante de transferencia');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('customerInfo', JSON.stringify(customerInfo));
      formData.append('items', JSON.stringify(items));
      formData.append('paymentMethod', 'transfer');
      formData.append('receipt', receiptFile);
      formData.append('restaurantId', restaurantId || '');
      formData.append('total', total.toString());

      formData.append('subtotal', subtotal.toString());
      formData.append('deliveryFee', deliveryFee.toString());

      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al crear el pedido');
      }

      const data = await response.json();
      setSuccess(true);
      setOrderNumber(data.orderNumber);

      if (data.whatsappNumber) {
        const orderSummary = items
          .map((item) => `• ${item.name} (${item.quantity}x) - $${(item.price * item.quantity).toFixed(2)}`)
          .join('\n');

        const message = `Hola! Quiero confirmar mi pedido abonado por transferencia:\n\n${orderSummary}\n\nTotal: $${total.toFixed(2)}\nDirección: ${customerInfo.address}\nNombre: ${customerInfo.fullName}\nNº Pedido: ${data.orderNumber}\n\n*Nota: Te enviaré aquí mismo el comprobante de pago.*`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappPhone = data.whatsappNumber.replace(/\s+/g, '');
        const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pedido enviado!
          </h1>
          {orderNumber && (
            <p className="text-gray-600 mb-4">
              Número de pedido: <span className="font-bold">{orderNumber}</span>
            </p>
          )}
          <p className="text-gray-600 mb-6">
            {paymentMethod === 'cash'
              ? 'Tu pedido fue enviado por WhatsApp. El restaurante se contactará contigo pronto.'
              : 'Tu comprobante fue recibido. El restaurante confirmará tu pedido en breve.'}
          </p>
          <Link
            href={`/menu/${restaurantSlug || params.slug}`}
            className="inline-block bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          {currentStep !== 'info' && (
            <button
              onClick={() => {
                if (currentStep === 'confirmation') {
                  setCurrentStep('payment');
                  setPaymentMethod(null);
                } else {
                  setCurrentStep('info');
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Atrás"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-600">
              Paso {currentStep === 'info' ? '1' : currentStep === 'payment' ? '2' : '3'}
              de 3
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pb-4 max-w-6xl mx-auto">
          <div className="flex gap-2">
            {['info', 'payment', 'confirmation'].map((step, idx) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-all ${
                  step === currentStep
                    ? 'bg-purple-600'
                    : ['info', 'payment'].includes(step) &&
                        ['payment', 'confirmation'].includes(currentStep)
                      ? 'bg-purple-300'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Customer Info */}
          {currentStep === 'info' && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Información de entrega
              </h2>

              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    Nombre completo
                  </div>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={customerInfo.fullName}
                  onChange={handleCustomerInfoChange}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    Email{' '}
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    Número de WhatsApp
                  </div>
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={customerInfo.whatsapp}
                  onChange={handleCustomerInfoChange}
                  placeholder="+54 11 1234 5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usamos esto para contactarte sobre tu pedido
                </p>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Dirección de envío
                  </div>
                </label>
                <textarea
                  name="address"
                  value={customerInfo.address}
                  onChange={handleCustomerInfoChange}
                  placeholder="Calle, número, piso, departamento..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Notas Adicionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600" />
                    Notas adicionales{' '}
                    <span className="text-xs text-gray-500">(opcional)</span>
                  </div>
                </label>
                <textarea
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleCustomerInfoChange}
                  placeholder="Ej: Timbre roto, llamar a la puerta..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Continue Button */}
              <button
                onClick={() => validateCustomerInfo() && setCurrentStep('payment')}
                disabled={!validateCustomerInfo()}
                className={`w-full font-semibold py-3 rounded-lg transition-all mt-6 ${
                  validateCustomerInfo()
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-95'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar al pago
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Método de pago
              </h2>

              {/* Cash Option */}
              <button
                onClick={() => handlePaymentMethodSelect('cash')}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Efectivo</h3>
                    <p className="text-sm text-gray-600">
                      Pagás al recibir tu pedido
                    </p>
                  </div>
                </div>
              </button>

              {/* Transfer Option */}
              <button
                onClick={() => handlePaymentMethodSelect('transfer')}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">Transferencia</h3>
                    <p className="text-sm text-gray-600">
                      Transferí y subí el comprobante
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && paymentMethod === 'cash' && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">
                Resumen del pedido
              </h2>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío:</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-transparent bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleWhatsAppOrder}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar pedido por WhatsApp
              </button>
            </div>
          )}

          {currentStep === 'confirmation' && paymentMethod === 'transfer' && (
            <div className="space-y-6">
              {/* Transfer Details */}
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Datos para transferir
                </h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Alias
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono font-bold text-gray-900">
                        restaurant.mercado
                      </p>
                      <button className="p-2 hover:bg-blue-100 rounded transition-colors">
                        <Copy className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Titular
                    </p>
                    <p className="font-medium text-gray-900 mt-1">
                      Restaurante S.R.L.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Banco
                    </p>
                    <p className="font-medium text-gray-900 mt-1">
                      Mercado Pago
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      CVU
                    </p>
                    <p className="font-mono font-medium text-gray-900 mt-1">
                      0000003100069110640011
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Luego sube el comprobante de la transferencia en el siguiente
                  paso.
                </p>
              </div>

              {/* Receipt Upload */}
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Comprobante de transferencia
                </h2>

                {receiptPreview ? (
                  <div className="space-y-4">
                    <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={receiptPreview}
                        alt="Comprobante"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={() => {
                          setReceiptPreview(null);
                          setReceiptFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-colors"
                        aria-label="Eliminar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">
                      Sube tu comprobante
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Foto o captura de pantalla
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  onClick={handleConfirmTransferOrder}
                  disabled={!receiptFile || loading}
                  className={`w-full font-bold py-3 rounded-lg transition-all mt-6 ${
                    receiptFile && !loading
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-95'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-32 space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Tu Pedido</h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-2 border-b border-gray-100"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío:</span>
                  <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-4">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-lg text-transparent bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
