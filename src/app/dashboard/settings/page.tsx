'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Save, Upload, AlertCircle } from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface RestaurantSettings {
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  require_email: boolean;
  welcome_message: string | null;
  discount_text: string | null;
  plan: 'free' | 'pro';
  delivery_enabled: boolean;
  whatsapp_number: string | null;
  delivery_fee: number | null;
  min_order_amount: number | null;
  transfer_alias: string | null;
  transfer_holder: string | null;
  transfer_bank: string | null;
  transfer_cbu: string | null;
}

export default function SettingsPage() {
  const { currentRestaurant, refetch } = useRestaurant();
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', currentRestaurant.id)
          .single();

        if (fetchError) throw fetchError;

        if (data) {
          setSettings({
            name: data.name,
            description: data.description,
            logo_url: data.logo_url,
            cover_url: data.cover_url,
            require_email: data.require_email,
            welcome_message: data.welcome_message,
            discount_text: data.discount_text,
            plan: data.plan,
            delivery_enabled: data.delivery_enabled,
            whatsapp_number: data.whatsapp_number,
            delivery_fee: data.delivery_fee,
            min_order_amount: data.min_order_amount,
            transfer_alias: data.transfer_alias,
            transfer_holder: data.transfer_holder,
            transfer_bank: data.transfer_bank,
            transfer_cbu: data.transfer_cbu,
          });
          setLogoPreview(data.logo_url);
          setCoverPreview(data.cover_url);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [currentRestaurant]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings((prev) =>
      prev
        ? {
            ...prev,
            [name]:
              type === 'checkbox'
                ? checked
                : type === 'number'
                  ? value === ''
                    ? null
                    : Number(value)
                  : value,
          }
        : null
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentRestaurant) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const updateData = { ...settings };

      // Upload logo if changed
      if (logoFile) {
        const logoPath = `logos/${currentRestaurant.id}-${Date.now()}.${logoFile.type.split('/')[1]}`;
        const { error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(logoPath, logoFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(logoPath);

        updateData.logo_url = publicUrl.publicUrl;
        setLogoFile(null);
      }

      // Upload cover if changed
      if (coverFile) {
        const coverPath = `covers/${currentRestaurant.id}-${Date.now()}.${coverFile.type.split('/')[1]}`;
        const { error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(coverPath, coverFile);

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('restaurant-images')
          .getPublicUrl(coverPath);

        updateData.cover_url = publicUrl.publicUrl;
        setCoverFile(null);
      }

      // Update restaurant data
      const { error: updateError } = await supabase
        .from('restaurants')
        .update(updateData)
        .eq('id', currentRestaurant.id);

      if (updateError) throw updateError;

      setSaveSuccess(true);
      await refetch();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  if (!settings || !currentRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">No se encontró configuración</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Configuración del Restaurante
        </h1>
        <p className="text-gray-600 mt-2">
          Personaliza tu restaurante y cómo se ve tu menú
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium text-sm">
          Cambios guardados exitosamente
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Información del Restaurante</h2>

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nombre del Restaurante *
            </label>
            <input
              type="text"
              name="name"
              value={settings.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={settings.description || ''}
              onChange={handleInputChange}
              placeholder="Cuenta sobre tu restaurante"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Logo</label>
            {logoPreview && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-300 w-32 h-32">
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              </div>
            )}
            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="text-center">
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-700">Subir Logo</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG (máx 5MB)</p>
              </div>
              <input
                type="file"
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Imagen de Portada
            </label>
            {coverPreview && (
              <div className="mb-3 rounded-lg overflow-hidden border border-gray-300 h-40">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all">
              <div className="text-center">
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-sm font-medium text-gray-700">Subir Portada</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG (máx 5MB)</p>
              </div>
              <input
                type="file"
                onChange={handleCoverChange}
                accept="image/*"
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Delivery and Payments Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery y Pagos</h2>

          {/* Delivery Enabled */}
          <div className="mb-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="delivery_enabled"
                checked={settings.delivery_enabled}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-900">Activar Delivery</span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-8">
              Permite que los clientes realicen pedidos con entrega a domicilio
            </p>
          </div>

          {settings.delivery_enabled && (
            <>
              {/* WhatsApp Number */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Número de WhatsApp
                </label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={settings.whatsapp_number || ''}
                  onChange={handleInputChange}
                  placeholder="+54 9 11 XXXX-XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Los clientes podrán contactarte por WhatsApp para consultas
                </p>
              </div>

              {/* Delivery Fee */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Costo de Delivery ($)
                </label>
                <input
                  type="number"
                  name="delivery_fee"
                  value={settings.delivery_fee || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Minimum Order */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Monto Mínimo de Pedido ($)
                </label>
                <input
                  type="number"
                  name="min_order_amount"
                  value={settings.min_order_amount || ''}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>
            </>
          )}

          {/* Bank Transfer Data Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Datos para Transferencia</h3>

            {/* Bank Alias */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Alias
              </label>
              <input
                type="text"
                name="transfer_alias"
                value={settings.transfer_alias || ''}
                onChange={handleInputChange}
                placeholder="mirestaurante.mp o tu alias"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Alias para transferencias bancarias</p>
            </div>

            {/* Bank Holder */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Titular de la Cuenta
              </label>
              <input
                type="text"
                name="transfer_holder"
                value={settings.transfer_holder || ''}
                onChange={handleInputChange}
                placeholder="Nombre completo o razón social"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Bank Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Banco
              </label>
              <input
                type="text"
                name="transfer_bank"
                value={settings.transfer_bank || ''}
                onChange={handleInputChange}
                placeholder="Banco Santander, BBVA, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>

            {/* Bank CBU/CVU */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                CBU/CVU
              </label>
              <input
                type="text"
                name="transfer_cbu"
                value={settings.transfer_cbu || ''}
                onChange={handleInputChange}
                placeholder="0720123456789012345678"
                maxLength={22}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-gray-600 mt-1">Número CBU o CVU de tu cuenta bancaria</p>
            </div>
          </div>
        </div>

        {/* Menu Behavior Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Comportamiento del Menú</h2>

          {/* Email Requirement */}
          <div className="mb-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="require_email"
                checked={settings.require_email}
                onChange={handleInputChange}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Solicitar email a los clientes
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-1 ml-8">
              Los clientes deberán proporcionar su email para acceder al menú
            </p>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Mensajes Personalizados</h2>

          {/* Welcome Message */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Mensaje de Bienvenida
            </label>
            <textarea
              name="welcome_message"
              value={settings.welcome_message || ''}
              onChange={handleInputChange}
              placeholder="Mensaje que verán tus clientes al abrir el menú"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Este mensaje aparecerá en la parte superior del menú
            </p>
          </div>

          {/* Discount Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Texto de Descuentos/Ofertas
            </label>
            <textarea
              name="discount_text"
              value={settings.discount_text || ''}
              onChange={handleInputChange}
              placeholder="Comparte tus ofertas especiales"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <p className="text-xs text-gray-600 mt-1">
              Aparecerá destacado en el menú de tus clientes
            </p>
          </div>
        </div>

        {/* Plan Info Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm p-4 sm:p-6 border border-purple-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Información del Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Plan Actual</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {settings.plan === 'pro' ? 'Pro' : 'Gratis'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Emails Disponibles</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {settings.plan === 'pro' ? 'Ilimitado' : '15/mes'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/subscription"
            className="block w-full px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 font-semibold transition-all text-center text-sm"
          >
            Ver Planes
          </Link>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg font-semibold transition-all disabled:opacity-50 text-sm"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
