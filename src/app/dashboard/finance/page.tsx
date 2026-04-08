'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Lock,
} from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

/* ------ Types ------------------------------------------------------------------------------------------------------------------------------------------------ */
interface FinanceCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
  category_name?: string;
  category_icon?: string;
}

/* ------ Default categories --------------------------------------------------------------------------------------------------------- */
const DEFAULT_CATEGORIES: { name: string; type: 'income' | 'expense'; icon: string }[] = [
  { name: 'Ventas', type: 'income', icon: '💰' },
  { name: 'Delivery', type: 'income', icon: '🛵' },
  { name: 'Eventos', type: 'income', icon: '🎉' },
  { name: 'Otros ingresos', type: 'income', icon: '📥' },
  { name: 'Insumos / Materia prima', type: 'expense', icon: '🥩' },
  { name: 'Sueldos', type: 'expense', icon: '👥' },
  { name: 'Alquiler', type: 'expense', icon: '🏠' },
  { name: 'Servicios (luz, gas, agua)', type: 'expense', icon: '💡' },
  { name: 'Impuestos', type: 'expense', icon: '🏛️' },
  { name: 'Mantenimiento', type: 'expense', icon: '🔧' },
  { name: 'Marketing', type: 'expense', icon: '📣' },
  { name: 'Delivery / Envios', type: 'expense', icon: '📦' },
  { name: 'Otros gastos', type: 'expense', icon: '📤' },
];

/* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Finance Page
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
export default function FinancePage() {
  const { currentRestaurant } = useRestaurant();
  const isPro = currentRestaurant?.plan === 'pro';

  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('📦');

  useEffect(() => {
    if (currentRestaurant) {
      loadData();
    }
  }, [currentRestaurant, currentMonth]);

  const loadData = async () => {
    if (!currentRestaurant) return;
    setLoading(true);
    const supabase = createClient();

    // Load categories, create defaults if none exist
    const { data: cats } = await supabase
      .from('finance_categories' as any)
      .select('id, name, type, icon')
      .eq('restaurant_id', currentRestaurant.id)
      .order('name') as any;

    let finalCats: FinanceCategory[] = cats || [];

    if (finalCats.length === 0) {
      // Create default categories
      const toInsert = DEFAULT_CATEGORIES.map(c => ({
        restaurant_id: currentRestaurant.id,
        name: c.name,
        type: c.type,
        icon: c.icon,
        is_default: true,
      }));
      const { data: inserted } = await supabase
        .from('finance_categories' as any)
        .insert(toInsert)
        .select('id, name, type, icon') as any;
      finalCats = inserted || [];
    }

    setCategories(finalCats);

    // Load transactions for current month
    const [year, month] = currentMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const { data: txns } = await supabase
      .from('finance_transactions' as any)
      .select('id, type, amount, description, date, category_id')
      .eq('restaurant_id', currentRestaurant.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false }) as any;

    const mapped: Transaction[] = (txns || []).map((t: any) => {
      const cat = finalCats.find(c => c.id === t.category_id);
      return {
        ...t,
        category_name: cat?.name || 'Sin categoria',
        category_icon: cat?.icon || '📦',
      };
    });

    setTransactions(mapped);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !formAmount) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('finance_transactions' as any).insert({
      restaurant_id: currentRestaurant.id,
      type: formType,
      amount: parseFloat(formAmount),
      description: formDescription || null,
      category_id: formCategoryId || null,
      date: formDate,
      created_by: user?.id,
    } as any);

    // Reset form
    setFormAmount('');
    setFormDescription('');
    setFormCategoryId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
    setSaving(false);
    loadData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRestaurant || !newCatName) return;

    const supabase = createClient();
    await supabase.from('finance_categories' as any).insert({
      restaurant_id: currentRestaurant.id,
      name: newCatName,
      type: newCatType,
      icon: newCatIcon,
    } as any);

    setNewCatName('');
    setShowCategoryForm(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('finance_transactions' as any).delete().eq('id', id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Month navigation
  const navigateMonth = (dir: number) => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1);
    return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  // Calculations
  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const balance = totalIncome - totalExpense;

  // Category breakdown (Pro feature)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; type: string; total: number }>();
    transactions.forEach(t => {
      const key = t.category_id || 'sin-cat';
      const existing = map.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        map.set(key, {
          name: t.category_name || 'Sin categoria',
          icon: t.category_icon || '📦',
          type: t.type,
          total: t.amount,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // CSV export (Pro feature)
  const handleExportCSV = () => {
    const headers = 'Fecha,Tipo,Categoria,Descripcion,Monto\n';
    const rows = transactions
      .map(t =>
        `${t.date},${t.type === 'income' ? 'Ingreso' : 'Egreso'},${t.category_name || ''},${(t.description || '').replace(/,/g, ';')},${t.amount}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzas-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCategories = categories.filter(c => c.type === formType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-gray-500 text-sm mt-1">Control de ingresos y egresos de tu restaurante</p>
        </div>
        <div className="flex gap-2">
          {isPro && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 capitalize w-48 text-center">{monthLabel}</h2>
        <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-green-700">${totalIncome.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Egresos</span>
          </div>
          <p className="text-2xl font-bold text-red-700">${totalExpense.toLocaleString('es-AR')}</p>
        </div>
        <div className={`border rounded-2xl p-5 ${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className={`flex items-center gap-2 mb-2 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Balance</span>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {balance < 0 ? '-' : ''}${Math.abs(balance).toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Pro: Category breakdown */}
      {isPro && categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-gray-900">Desglose por categoria</h3>
          </div>
          <div className="space-y-3">
            {categoryBreakdown.map((cat, i) => {
              const maxTotal = categoryBreakdown[0]?.total || 1;
              const pct = totalIncome + totalExpense > 0
                ? ((cat.total / (cat.type === 'income' ? totalIncome : totalExpense)) * 100)
                : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 truncate">{cat.name}</span>
                      <span className="font-bold text-gray-900 flex-shrink-0">
                        ${cat.total.toLocaleString('es-AR')}
                        <span className="text-xs text-gray-400 ml-1">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cat.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`}
                        style={{ width: `${(cat.total / maxTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pro upsell for free users */}
      {!isPro && transactions.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Desbloquea graficos y reportes avanzados</p>
            <p className="text-sm text-gray-600">Con el Plan Pro ves desglose por categoria, tendencias mensuales y exportas a CSV.</p>
          </div>
          <a href="/dashboard/subscription" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex-shrink-0">
            Ver Pro
          </a>
        </div>
      )}

      {/* Transactions list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Movimientos</h3>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="text-xs text-purple-600 font-medium hover:text-purple-800"
          >
            + Agregar categoria
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No hay movimientos en este mes</p>
            <p className="text-sm text-gray-400 mt-1">Registra tu primer ingreso o egreso</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map(t => (
              <div key={t.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <span className="text-xl w-8 text-center">{t.category_icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {t.description || t.category_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.category_name} · {new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('es-AR')}
                </p>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------ New transaction modal ------------------------------------------------------------------------ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
            <h3 className="text-lg font-bold text-gray-900">Nuevo movimiento</h3>

            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setFormType('income'); setFormCategoryId(''); }}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  formType === 'income'
                    ? 'bg-green-100 text-green-700 border-2 border-green-400'
                    : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => { setFormType('expense'); setFormCategoryId(''); }}
                className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  formType === 'expense'
                    ? 'bg-red-100 text-red-700 border-2 border-red-400'
                    : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                }`}
              >
                Egreso
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formCategoryId}
                  onChange={e => setFormCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar...</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Ej: Compra de carne para el fin de semana"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || !formAmount}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                    formType === 'income'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {saving ? 'Guardando...' : `Registrar ${formType === 'income' ? 'ingreso' : 'egreso'}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------ New category modal --------------------------------------------------------------------------------- */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Nueva categoria</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewCatType('income')}
                  className={`py-2 rounded-xl text-sm font-semibold ${
                    newCatType === 'income' ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setNewCatType('expense')}
                  className={`py-2 rounded-xl text-sm font-semibold ${
                    newCatType === 'expense' ? 'bg-red-100 text-red-700 border-2 border-red-400' : 'bg-gray-50 text-gray-500 border-2 border-transparent'
                  }`}
                >
                  Egreso
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={e => setNewCatIcon(e.target.value)}
                  className="w-16 px-3 py-2.5 border border-gray-300 rounded-xl text-center text-xl"
                  maxLength={2}
                />
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Nombre de la categoria"
                  required
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700">
                  Crear
                </button>
                <button type="button" onClick={() => setShowCategoryForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
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
