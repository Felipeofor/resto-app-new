'use client';

import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';

interface RestaurantSettings {
  name: string;
  description: string;
  logo_url: string | null;
  cover_url: string | null;
  require_email: boolean;
  welcome_message: string;
  discount_text: string;
  plan: 'free' | 'pro';
  menu_display: 'list' | 'grid';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: 'Mi Restaurante',
    description: 'Bienvenido a nuestro restaurante',
    logo_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=restaurant',
    cover_url: 'https://images.unsplash.com/photo-1504674900969-f2150319c078?w=800&h=400&fit=crop',
    require_email: false,
    welcome_message:
      'Bienvenido a nuestro menú digital. Explora nuestras deliciosas opciones.',
    discount_text: 'Aprovecha nuestras ofertas especiales de hoy',
    plan: 'free',
    menu_display: 'list',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url);
  const [coverPreview, setCoverPreview] = useState<string | null>(settings.cover_url);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setSettings((prev) => ({
          ...prev,
          logo_url: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
        setSettings((prev) => ({
          ...prev,
          cover_url: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Configuración del Restaurante</h1>
        <p className="text-gray-600 mt-2">
          Personaliza tu restaurante y cómo se ve tu menú
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
          Cambios guardados exitosamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Info Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={settings.description}
              onChange={handleInputChange}
              placeholder="Cuenta sobre tu restaurante"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

        {/* Menu Behavior Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
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

          {/* Menu Display */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Formato de Visualización
            </label>
            <select
              name="menu_display"
              value={settings.menu_display}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="list">Lista (Vertical)</option>
              <option value="grid">Grid (Fotografías)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Cómo se verá el menú cuando tus clientes lo abran
            </p>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Mensajes Personalizados</h2>

          {/* Welcome Message */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Mensaje de Bienvenida
            </label>
            <textarea
              name="welcome_message"
              value={settings.welcome_message}
              onChange={handleInputChange}
              placeholder="Mensaje que verán tus clientes al abrir el menú"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              value={settings.discount_text}
              onChange={handleInputChange}
              placeholder="Comparte tus ofertas especiales"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Aparecerá destacado en el menú de tus clientes
            </p>
          </div>
        </div>

        {/* Plan Info Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-purple-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Información del Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <button
            type="button"
            className="mt-4 w-full px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-50 font-semibold transition-all"
          >
            Ver Planes
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:shadow-lg font-semibold transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
