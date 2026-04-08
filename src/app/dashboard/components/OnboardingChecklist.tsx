'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Store,
  LayoutGrid,
  UtensilsCrossed,
  QrCode,
  Palette,
  ChevronDown,
  ChevronUp,
  Rocket,
  X,
} from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface Step {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
}

export default function OnboardingChecklist() {
  const { currentRestaurant } = useRestaurant();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!currentRestaurant) return;

    // Check if user dismissed the checklist
    const key = `onboarding-dismissed-${currentRestaurant.id}`;
    if (localStorage.getItem(key) === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    checkProgress();
  }, [currentRestaurant]);

  const checkProgress = async () => {
    if (!currentRestaurant) return;
    const supabase = createClient();

    const [categoriesRes, itemsRes, settingsRes] = await Promise.all([
      supabase
        .from('menu_categories')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', currentRestaurant.id),
      supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', currentRestaurant.id),
      supabase
        .from('restaurants')
        .select('description, logo_url, primary_color')
        .eq('id', currentRestaurant.id)
        .single() as any,
    ]);

    const hasDescription = !!settingsRes.data?.description;
    const hasLogo = !!settingsRes.data?.logo_url;
    const hasColor = !!settingsRes.data?.primary_color;
    const hasCategories = (categoriesRes.count || 0) > 0;
    const hasItems = (itemsRes.count || 0) > 0;
    const hasPersonalization = hasLogo || hasColor;

    setSteps([
      {
        id: 'info',
        label: 'Completa los datos de tu restaurante',
        description: 'Nombre, descripcion y datos de contacto',
        href: '/dashboard/settings',
        icon: Store,
        completed: hasDescription,
      },
      {
        id: 'categories',
        label: 'Crea tu primera categoria',
        description: 'Ej: Entradas, Platos principales, Postres',
        href: '/dashboard/categories',
        icon: LayoutGrid,
        completed: hasCategories,
      },
      {
        id: 'items',
        label: 'Agrega tu primer plato',
        description: 'Nombre, precio, descripcion y foto',
        href: '/dashboard/menu/new',
        icon: UtensilsCrossed,
        completed: hasItems,
      },
      {
        id: 'qr',
        label: 'Genera tu codigo QR',
        description: 'Descargalo e imprimilo para tus mesas',
        href: '/dashboard/qr',
        icon: QrCode,
        completed: hasItems, // Can generate QR once they have items
      },
      {
        id: 'brand',
        label: 'Personaliza tu marca',
        description: 'Logo, colores y estilo de tu menu',
        href: '/dashboard/settings',
        icon: Palette,
        completed: hasPersonalization,
      },
    ]);

    setLoading(false);
  };

  const handleDismiss = () => {
    if (!currentRestaurant) return;
    localStorage.setItem(`onboarding-dismissed-${currentRestaurant.id}`, 'true');
    setDismissed(true);
  };

  if (loading || dismissed) return null;

  const completedCount = steps.filter(s => s.completed).length;
  const allDone = completedCount === steps.length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  // Don't show if all steps are done
  if (allDone) return null;

  return (
    <div className="bg-white rounded-2xl border border-purple-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Configura tu restaurante</h3>
            <p className="text-sm text-gray-500">{completedCount} de {steps.length} pasos completados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
            title="Ocultar checklist"
          >
            <X className="w-4 h-4" />
          </button>
          {collapsed ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="px-6 py-4 space-y-1">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.id}
                href={step.completed ? '#' : step.href}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  step.completed
                    ? 'opacity-60'
                    : 'hover:bg-purple-50 cursor-pointer'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${step.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>
                <Icon className={`w-5 h-5 flex-shrink-0 ${step.completed ? 'text-gray-300' : 'text-purple-400'}`} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
