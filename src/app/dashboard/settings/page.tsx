'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  AlertCircle,
  CheckCircle2,
  Store,
  CreditCard,
  Palette,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Gift,
  UtensilsCrossed,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

/* ------ Types ------------------------------------------------------------------------------------------------------------------------------------------------ */
interface RestaurantSettings {
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  // Payments & delivery
  delivery_enabled: boolean;
  delivery_fee: number | null;
  min_order_amount: number | null;
  transfer_alias: string | null;
  transfer_holder: string | null;
  transfer_bank: string | null;
  transfer_cbu: string | null;
  // Visual
  primary_color: string | null;
  default_view: 'list' | 'grid';
  // Email incentive
  incentive_type: 'discount' | 'free_item' | 'exclusive' | 'loyalty' | 'none';
  incentive_title: string | null;
  incentive_description: string | null;
  incentive_code: string | null;
  // Service mode
  service_mode: 'delivery' | 'dine_in';
  // Menu behaviour
  require_email: boolean;
  welcome_message: string | null;
  discount_text: string | null;
  plan: 'free' | 'pro';
}

/* ------ Collapsible section wrapper ------------------------------------------------------------------------------ */
function Section({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6 pt-2 space-y-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

/* ------ Field wrapper ------------------------------------------------------------------------------------------------------------------------ */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow';

/* ------ Image uploader --------------------------------------------------------------------------------------------------------------------- */
function ImageUploader({
  label,
  hint,
  preview,
  aspectClass,
  onChange,
}: {
  label: string;
  hint?: string;
  preview: string | null;
  aspectClass: string;
  onChange: (f: File) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      {preview && (
        <div className={`mb-3 rounded-xl overflow-hidden border border-gray-200 ${aspectClass} w-full`}>
          <img src={preview} alt={label} className="w-full h-full object-cover" />
        </div>
      )}
      <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50/40 transition-all">
        <Upload className="w-5 h-5 text-gray-400" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            {preview ? 'Reemplazar imagen' : `Subir ${label}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">PNG, JPG (máx 5 MB)</p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange(f);
          }}
        />
      </label>
    </Field>
  );
}

/* ------ Color swatches --------------------------------------------------------------------------------------------------------------------- */
const PRESET_COLORS = [
  { label: 'Naranja', value: '#f97316' },
  { label: 'Rojo', value: '#ef4444' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#22c55e' },
  { label: 'Amarillo', value: '#eab308' },
  { label: 'Negro', value: '#111827' },
];

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Create Restaurant Form (shown when user has no restaurant)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
function CreateRestaurantForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toSlug = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (!slugManual) setSlug(toSlug(e.target.value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setSlug(toSlug(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { error: insertError } = await sb.from('restaurants').insert({
        owner_id: user.id,
        name: name.trim(),
        slug: slug.trim(),
      });

      if (insertError) {
        if (insertError.message.includes('unique') || insertError.code === '23505') {
          setError('Ese slug ya está en uso. Elegí otro nombre o modificalo.');
        } else {
          setError(insertError.message);
        }
        return;
      }

      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el restaurante');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Creá tu restaurante</h2>
        <p className="text-gray-500 text-sm mb-6">Configurá el nombre y la URL de tu menú digital.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del restaurante
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Ej: La Parrilla de Juan"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL del menú
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">/menu/</span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="la-parrilla-de-juan"
                required
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Solo letras, números y guiones.</p>
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim() || !slug.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</> : 'Crear restaurante'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Main Page
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
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

  /* Fetch settings */
  useEffect(() => {
    async function fetch() {
      if (!currentRestaurant) { setLoading(false); return; }
      try {
        const sb = createClient();
        const { data, error: e } = await sb
          .from('restaurants')
          .select('*')
          .eq('id', currentRestaurant.id)
          .single();
        if (e) throw e;
        if (data) {
          setSettings({
            name: data.name,
            description: data.description ?? null,
            logo_url: data.logo_url ?? null,
            cover_url: data.cover_url ?? null,
            address: data.address ?? null,
            phone: data.phone ?? null,
            whatsapp_number: data.whatsapp_number ?? null,
            delivery_enabled: data.delivery_enabled ?? false,
            delivery_fee: data.delivery_fee ?? null,
            min_order_amount: data.min_order_amount ?? null,
            transfer_alias: data.transfer_alias ?? null,
            transfer_holder: data.transfer_holder ?? null,
            transfer_bank: data.transfer_bank ?? null,
            transfer_cbu: data.transfer_cbu ?? null,
            primary_color: data.primary_color ?? '#f97316',
            default_view: data.default_view ?? 'list',
            incentive_type: data.incentive_type ?? 'discount',
            incentive_title: data.incentive_title ?? '10% de descuento',
            incentive_description: data.incentive_description ?? 'En tu próxima visita o pedido online',
            incentive_code: data.incentive_code ?? null,
            service_mode: data.service_mode ?? 'delivery',
            require_email: data.require_email ?? false,
            welcome_message: data.welcome_message ?? null,
            discount_text: data.discount_text ?? null,
            plan: data.plan ?? 'free',
          });
          setLogoPreview(data.logo_url ?? null);
          setCoverPreview(data.cover_url ?? null);
        }
      } catch (err) {
        console.error(err);
        setError('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [currentRestaurant]);

  /* Generic field change */
  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                  ? value === '' ? null : Number(value)
                  : value,
          }
        : null
    );
  };

  const setProp = (key: keyof RestaurantSettings, val: unknown) =>
    setSettings((prev) => (prev ? { ...prev, [key]: val } : null));

  /* Image preview helpers */
  const previewFile = (file: File, setter: (s: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* Save */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !currentRestaurant) return;
    setSaving(true);
    setError(null);
    try {
      const sb = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData = { ...settings } as any;

      if (logoFile) {
        const ext = logoFile.type.split('/')[1];
        const path = `logos/${currentRestaurant.id}-${Date.now()}.${ext}`;
        const { error: ue } = await sb.storage.from('restaurant-images').upload(path, logoFile);
        if (ue) throw ue;
        const { data: { publicUrl } } = sb.storage.from('restaurant-images').getPublicUrl(path);
        updateData.logo_url = publicUrl;
        setLogoFile(null);
      }

      if (coverFile) {
        const ext = coverFile.type.split('/')[1];
        const path = `covers/${currentRestaurant.id}-${Date.now()}.${ext}`;
        const { error: ue } = await sb.storage.from('restaurant-images').upload(path, coverFile);
        if (ue) throw ue;
        const { data: { publicUrl } } = sb.storage.from('restaurant-images').getPublicUrl(path);
        updateData.cover_url = publicUrl;
        setCoverFile(null);
      }

      const { error: ue } = await sb
        .from('restaurants')
        .update(updateData)
        .eq('id', currentRestaurant.id);
      if (ue) throw ue;

      setSaveSuccess(true);
      await refetch();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      setError('Error al guardar. Revisá los datos e intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  /* ------ Render --------------------------------------------------------------------------------------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (!settings || !currentRestaurant) {
    return <CreateRestaurantForm onCreated={refetch} />;
  }

  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${currentRestaurant.slug}`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 text-sm mt-1">
            Personalizá cómo se ve y funciona tu restaurante
          </p>
        </div>
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-purple-600 font-semibold hover:text-purple-800 transition-colors mt-1 flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Ver menú
        </a>
      </div>

      {/* Toast banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Cambios guardados exitosamente
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ------ 1. Info del local --------------------------------------------------------------------------------------------- */}
        <Section
          icon={Store}
          title="Información del Local"
          subtitle="Nombre, descripción, imágenes y datos de contacto"
        >
          <Field label="Nombre del Restaurante *">
            <input
              type="text"
              name="name"
              value={settings.name}
              onChange={set}
              required
              className={inputCls}
            />
          </Field>

          <Field label="Descripción" hint="Aparece debajo del nombre en el menú del cliente">
            <textarea
              name="description"
              value={settings.description || ''}
              onChange={set}
              placeholder="Auténtica parrilla argentina desde 1985---"
              rows={3}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Dirección">
              <input
                type="text"
                name="address"
                value={settings.address || ''}
                onChange={set}
                placeholder="Av. Corrientes 1234, CABA"
                className={inputCls}
              />
            </Field>
            <Field label="Teléfono">
              <input
                type="tel"
                name="phone"
                value={settings.phone || ''}
                onChange={set}
                placeholder="+54 11 XXXX-XXXX"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="WhatsApp" hint="Los clientes pueden contactarte para consultas">
            <input
              type="tel"
              name="whatsapp_number"
              value={settings.whatsapp_number || ''}
              onChange={set}
              placeholder="+54 9 11 XXXX-XXXX"
              className={inputCls}
            />
          </Field>

          <ImageUploader
            label="Logo"
            hint="Se muestra en el menú y en los emails. Recomendado: cuadrado, fondo transparente."
            preview={logoPreview}
            aspectClass="h-32 w-32 mx-auto"
            onChange={(f) => { setLogoFile(f); previewFile(f, setLogoPreview); }}
          />

          <ImageUploader
            label="Imagen de Portada"
            hint="Foto hero que aparece en el encabezado del menú. Recomendado: 1200×400 px."
            preview={coverPreview}
            aspectClass="h-40"
            onChange={(f) => { setCoverFile(f); previewFile(f, setCoverPreview); }}
          />
        </Section>

        {/* ------ 2. Modo de Servicio ------------------------------------------------------------------------------------- */}
        <Section
          icon={UtensilsCrossed}
          title="Modo de Servicio"
          subtitle="Cómo usan tus clientes el menú digital"
        >
          <Field
            label="¿Cómo funciona tu menú?"
            hint="Podés cambiarlo en cualquier momento"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setProp('service_mode', 'delivery')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all text-center ${
                  settings.service_mode === 'delivery'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Truck className="w-6 h-6" />
                <span className="text-sm font-semibold">Delivery / Pedidos</span>
                <span className="text-xs text-gray-500">
                  Carrito, checkout y pedidos online
                </span>
              </button>
              <button
                type="button"
                onClick={() => setProp('service_mode', 'dine_in')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all text-center ${
                  settings.service_mode === 'dine_in'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <UtensilsCrossed className="w-6 h-6" />
                <span className="text-sm font-semibold">Restaurante / Mesa</span>
                <span className="text-xs text-gray-500">
                  El cliente arma su selección y se la muestra al mozo
                </span>
              </button>
            </div>
          </Field>
        </Section>

        {/* ------ 3. Pagos y delivery ------------------------------------------------------------------------------------------ */}
        <Section
          icon={CreditCard}
          title="Pagos y Delivery"
          subtitle="Datos de transferencia y configuración de envíos"
        >
          {/* Delivery toggle */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="delivery_enabled"
              name="delivery_enabled"
              checked={settings.delivery_enabled}
              onChange={set}
              className="w-5 h-5 rounded text-purple-600 focus:ring-2 focus:ring-purple-500 mt-0.5"
            />
            <label htmlFor="delivery_enabled" className="cursor-pointer">
              <p className="text-sm font-semibold text-gray-800">Activar Delivery</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Los clientes podrán pedir con entrega a domicilio
              </p>
            </label>
          </div>

          {settings.delivery_enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Field label="Costo de Delivery ($)">
                <input
                  type="number"
                  name="delivery_fee"
                  value={settings.delivery_fee ?? ''}
                  onChange={set}
                  min="0"
                  step="50"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
              <Field label="Pedido Mínimo ($)">
                <input
                  type="number"
                  name="min_order_amount"
                  value={settings.min_order_amount ?? ''}
                  onChange={set}
                  min="0"
                  step="100"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>
          )}

          {/* Bank data */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-4">Datos para Transferencia</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Alias" hint="Ej: mirestaurante.mp">
                  <input
                    type="text"
                    name="transfer_alias"
                    value={settings.transfer_alias || ''}
                    onChange={set}
                    placeholder="mi.restaurante"
                    className={inputCls}
                  />
                </Field>
                <Field label="Titular de la Cuenta">
                  <input
                    type="text"
                    name="transfer_holder"
                    value={settings.transfer_holder || ''}
                    onChange={set}
                    placeholder="Juan García"
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Banco">
                  <input
                    type="text"
                    name="transfer_bank"
                    value={settings.transfer_bank || ''}
                    onChange={set}
                    placeholder="Mercado Pago, Santander---"
                    className={inputCls}
                  />
                </Field>
                <Field label="CBU / CVU">
                  <input
                    type="text"
                    name="transfer_cbu"
                    value={settings.transfer_cbu || ''}
                    onChange={set}
                    placeholder="0720000000000000000000"
                    maxLength={22}
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ------ 3. Personalización Visual --------------------------------------------------------------------- */}
        <Section
          icon={Palette}
          title="Personalización Visual"
          subtitle="Color de marca y vista predeterminada del menú"
        >
          {/* Color picker */}
          <Field
            label="Color Principal"
            hint="Se usa en botones, iconos y acentos de tu menú"
          >
            <div className="flex flex-wrap gap-3 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setProp('primary_color', c.value)}
                  className={`w-9 h-9 rounded-full border-4 transition-all ${
                    settings.primary_color === c.value
                      ? 'border-gray-800 scale-110 shadow-lg'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
              {/* Custom color */}
              <label
                title="Color personalizado"
                className="relative w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors overflow-hidden"
              >
                <input
                  type="color"
                  value={settings.primary_color || '#f97316'}
                  onChange={(e) => setProp('primary_color', e.target.value)}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <span className="text-xs text-gray-400 select-none pointer-events-none">+</span>
              </label>
            </div>
            {/* Preview swatch */}
            <div className="mt-3 flex items-center gap-3">
              <div
                className="h-10 flex-1 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                style={{ background: settings.primary_color || '#f97316' }}
              >
                Vista previa del botón
              </div>
            </div>
          </Field>

          {/* Default view */}
          <Field
            label="Vista Predeterminada del Menú"
            hint="Los clientes podrán cambiarlo, pero esta es la vista inicial"
          >
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(['list', 'grid'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setProp('default_view', v)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 border-2 rounded-xl transition-all ${
                    settings.default_view === v
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {v === 'list' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  )}
                  <span className="text-sm font-semibold">
                    {v === 'list' ? 'Lista' : 'Galería'}
                  </span>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ------ 4. Incentivo de Email --------------------------------------------------------------------------------- */}
        <Section
          icon={Gift}
          title="Incentivo para Captura de Email"
          subtitle="Qué beneficio le ofrecés al cliente a cambio de su correo"
        >
          {/* Type selector */}
          <Field label="Tipo de beneficio">
            <div className="grid grid-cols-2 gap-2 mt-1">
              {([
                { value: 'discount', emoji: '🏷️', label: 'Descuento' },
                { value: 'free_item', emoji: '🎁', label: 'Producto gratis' },
                { value: 'exclusive', emoji: '👑', label: 'Acceso exclusivo' },
                { value: 'loyalty', emoji: '---', label: 'Puntos / Fidelidad' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProp('incentive_type', opt.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all ${
                    settings.incentive_type === opt.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field
            label="Título del beneficio"
            hint="Texto grande y llamativo que ve el cliente. Ej: '15% de descuento', 'Postre gratis'"
          >
            <input
              type="text"
              name="incentive_title"
              value={settings.incentive_title || ''}
              onChange={set}
              placeholder="Ej: 15% de descuento en tu primer pedido"
              maxLength={60}
              className={inputCls}
            />
          </Field>

          <Field
            label="Descripción (opcional)"
            hint="Detalles o condiciones del beneficio"
          >
            <input
              type="text"
              name="incentive_description"
              value={settings.incentive_description || ''}
              onChange={set}
              placeholder="Ej: Válido para pedidos mayores a $3000"
              maxLength={100}
              className={inputCls}
            />
          </Field>

          <Field
            label="Código promocional (opcional)"
            hint="Si tenés un cupón, el cliente lo verá al registrarse. Dejalo vacío si no aplica."
          >
            <input
              type="text"
              name="incentive_code"
              value={settings.incentive_code || ''}
              onChange={set}
              placeholder="BIENVENIDO10"
              maxLength={20}
              className={`${inputCls} uppercase font-mono tracking-wider`}
              style={{ textTransform: 'uppercase' }}
            />
          </Field>

          {/* Preview */}
          {settings.incentive_title && (
            <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50/40 p-4">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Vista previa del incentivo</p>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center text-lg flex-shrink-0">
                  {settings.incentive_type === 'discount' ? '🏷️'
                    : settings.incentive_type === 'free_item' ? '🎁'
                    : settings.incentive_type === 'exclusive' ? '👑' : '---'}
                </div>
                <div>
                  <p className="font-black text-gray-900">{settings.incentive_title}</p>
                  {settings.incentive_description && (
                    <p className="text-sm text-gray-500">{settings.incentive_description}</p>
                  )}
                  {settings.incentive_code && (
                    <p className="text-xs text-gray-400 mt-1">Código: <span className="font-mono font-bold">{settings.incentive_code.toUpperCase()}</span> (se revela al registrarse)</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ------ 5. Configuración del Menú --------------------------------------------------------------------- */}
        <Section
          icon={SlidersHorizontal}
          title="Configuración del Menú"
          subtitle="Comportamiento, mensajes y opciones del menú digital"
        >
          {/* Require email */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="require_email"
              name="require_email"
              checked={settings.require_email}
              onChange={set}
              className="w-5 h-5 rounded text-purple-600 focus:ring-2 focus:ring-purple-500 mt-0.5"
            />
            <label htmlFor="require_email" className="cursor-pointer">
              <p className="text-sm font-semibold text-gray-800">Solicitar email al cliente</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Los clientes deberán ingresar su correo antes de ver el menú
              </p>
            </label>
          </div>

          <Field label="Mensaje de Bienvenida" hint="Aparece en la pantalla de registro de email">
            <textarea
              name="welcome_message"
              value={settings.welcome_message || ''}
              onChange={set}
              placeholder="¡Bienvenido! Ingresá tu correo para ver nuestro menú."
              rows={2}
              className={inputCls}
            />
          </Field>

          <Field
            label="Texto de Oferta / Descuento"
            hint="Se muestra destacado en el email de bienvenida al cliente"
          >
            <textarea
              name="discount_text"
              value={settings.discount_text || ''}
              onChange={set}
              placeholder="10% de descuento en tu próxima visita"
              rows={2}
              className={inputCls}
            />
          </Field>

          {/* Plan info */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Plan actual</p>
              <p className="text-xl font-bold text-purple-700 mt-0.5">
                {settings.plan === 'pro' ? '--- Pro' : 'Gratuito'}
              </p>
            </div>
            <Link
              href="/dashboard/subscription"
              className="text-sm text-purple-600 font-semibold hover:text-purple-800 transition-colors"
            >
              Ver planes ---
            </Link>
          </div>
        </Section>

        {/* ------ Sticky save button ------------------------------------------------------------------------------------------ */}
        <div className="sticky bottom-4 z-10">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all text-base"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </form>
    </div>
  );
}
