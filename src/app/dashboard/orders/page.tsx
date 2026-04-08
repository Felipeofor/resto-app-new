'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Circle,
  ChevronDown,
  Phone,
  FileText,
  Clock,
  AlertCircle,
  Trash2,
  CheckCircle,
  MessageCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { useRestaurant } from '@/lib/context/restaurant-context';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  order_items?: OrderItem[];
  total: number;
  payment_method: 'cash' | 'transfer';
  payment_status: 'pending' | 'confirmed' | 'rejected' | 'uploaded';
  transfer_receipt_url?: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-400' },
  preparing: { label: 'En Preparación', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800', dot: 'bg-green-400' },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', dot: 'bg-red-400' },
};

const getRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
};

export default function OrdersPage() {
  const { currentRestaurant } = useRestaurant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof statusConfig | 'all'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentRestaurant) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('restaurant_id', currentRestaurant.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        const formattedOrders: Order[] = (data || []).map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          delivery_address: order.delivery_address,
          order_items: (order.order_items || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          })),
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status,
          transfer_receipt_url: order.transfer_receipt_url,
          order_status: order.order_status,
          created_at: order.created_at,
        }));

        setOrders(formattedOrders);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Error al cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentRestaurant]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        selectedFilter === 'all' || order.order_status === (selectedFilter as Order['order_status']);

      return matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, selectedFilter]);

  const stats = {
    today: orders.filter((o) => {
      const today = new Date().toDateString();
      return new Date(o.created_at).toDateString() === today;
    }).length,
    revenue: orders
      .filter((o) => o.order_status === 'delivered' || o.order_status === 'confirmed')
      .reduce((sum, o) => sum + o.total, 0),
    pending: orders.filter((o) => o.order_status === 'pending').length,
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['order_status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: 'confirmed' | 'rejected') => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, payment_status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-gray-900">Pedidos</h1>
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-green-400 text-green-400" />
              <span className="text-sm text-gray-600">Conectado</span>
            </div>
          </div>
          <p className="text-gray-600 mt-1">Gestiona todos los pedidos de tus clientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm">Pedidos Hoy</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <p className="text-gray-600 text-sm">Ingreso del Día</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">${stats.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm">Pedidos Pendientes</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de pedido o nombre del cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(
            (filter) => (
              <button
                key={filter}
                onClick={() =>
                  setSelectedFilter(filter as keyof typeof statusConfig | 'all')
                }
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all'
                  ? 'Todos'
                  : statusConfig[filter as keyof typeof statusConfig].label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No hay pedidos</p>
            <p className="text-gray-400 text-sm mt-1">
              Los pedidos aparecerán aquí cuando tus clientes realicen sus órdenes
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const itemsSummary = (order.order_items || [])
              .map((item) => `${item.quantity}x ${item.name}`)
              .join(', ');

            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Main Order Row */}
                <button
                  onClick={() =>
                    setExpandedOrderId(isExpanded ? null : order.id)
                  }
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-4 items-center">
                    {/* Order Number */}
                    <div>
                      <p className="text-sm text-gray-600">Pedido</p>
                      <p className="font-bold text-gray-900">{order.order_number}</p>
                    </div>

                    {/* Customer */}
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-medium text-gray-900 truncate">{order.customer_name}</p>
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                      >
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </a>
                    </div>

                    {/* Items */}
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="text-sm text-gray-900 truncate">{itemsSummary}</p>
                    </div>

                    {/* Total */}
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-bold text-gray-900">${order.total}</p>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <p className="text-sm text-gray-600">Pago</p>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_method === 'cash'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-gray-600">Estado</p>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.order_status].color}`}>
                        {statusConfig[order.order_status].label}
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Hace</p>
                      <p className="font-medium text-gray-900">{getRelativeTime(order.created_at)}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items Details */}
                      <div>
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Items del Pedido
                        </h3>
                        <div className="space-y-2 bg-white rounded-lg p-4">
                          {(order.order_items || []).map((item) => (
                            <div key={item.id} className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.quantity}x {item.name}
                                </p>
                                {item.notes && (
                                  <p className="text-sm text-gray-600 italic">{item.notes}</p>
                                )}
                              </div>
                              <p className="font-semibold text-gray-900 ml-4">${item.price}</p>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="flex justify-between">
                              <p className="font-bold text-gray-900">Total</p>
                              <p className="font-bold text-gray-900">${order.total}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div>
                        <h3 className="font-bold text-gray-900 mb-3">Información del Cliente</h3>
                        <div className="bg-white rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Nombre</p>
                            <p className="font-medium text-gray-900">{order.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{order.customer_email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Teléfono</p>
                            <a
                              href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                              className="font-medium text-green-600 hover:text-green-700 flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              {order.customer_phone}
                            </a>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Dirección de Entrega</p>
                            <p className="font-medium text-gray-900">{order.delivery_address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {order.payment_method === 'transfer' && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-3">Comprobante de Transferencia</h3>
                        <div className="bg-white rounded-lg p-4">
                          {order.transfer_receipt_url ? (
                            <div className="space-y-3">
                              <button
                                onClick={() => setShowReceiptModal(order.id)}
                                className="relative rounded-lg overflow-hidden border border-gray-300 hover:border-purple-500 transition-all cursor-pointer group"
                              >
                                <img
                                  src={order.transfer_receipt_url}
                                  alt="Comprobante de pago"
                                  className="w-full h-48 object-cover group-hover:opacity-75 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-white" />
                                </div>
                              </button>

                              <div className="flex gap-2">
                                {order.payment_status !== 'confirmed' && (
                                  <button
                                    onClick={() => updatePaymentStatus(order.id, 'confirmed')}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all flex items-center justify-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Confirmar Pago
                                  </button>
                                )}
                                {order.payment_status !== 'rejected' && (
                                  <button
                                    onClick={() => updatePaymentStatus(order.id, 'rejected')}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all flex items-center justify-center gap-2"
                                  >
                                    <AlertCircle className="w-4 h-4" />
                                    Rechazar Pago
                                  </button>
                                )}
                              </div>

                              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                <p className="text-blue-900">
                                  Estado: <span className="font-bold">{
                                    order.payment_status === 'confirmed'
                                      ? 'Confirmado'
                                      : order.payment_status === 'rejected'
                                      ? 'Rechazado'
                                      : 'Pendiente de Confirmación'
                                  }</span>
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-600">No hay comprobante de transferencia</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Management */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Cambiar Estado</h3>
                      <div className="flex flex-wrap gap-2">
                        {order.order_status !== 'cancelled' && (
                          <>
                            {order.order_status !== 'confirmed' && order.order_status !== 'preparing' && order.order_status !== 'ready' && order.order_status !== 'delivered' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusConfig.confirmed.color}`}
                              >
                                Confirmar
                              </button>
                            )}
                            {['confirmed', 'pending'].includes(order.order_status) && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusConfig.preparing.color}`}
                              >
                                Preparando
                              </button>
                            )}
                            {['preparing', 'confirmed'].includes(order.order_status) && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusConfig.ready.color}`}
                              >
                                Listo
                              </button>
                            )}
                            {['ready', 'preparing', 'confirmed'].includes(order.order_status) && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusConfig.delivered.color}`}
                              >
                                Entregado
                              </button>
                            )}
                          </>
                        )}

                        {order.order_status !== 'delivered' && order.order_status !== 'cancelled' && (
                          <button
                            onClick={() => setShowDeleteConfirm(order.id)}
                            className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium transition-all flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancel Confirmation Modal */}
                {showDeleteConfirm === order.id && (
                  <div className="border-t border-gray-200 p-4 bg-red-50">
                    <p className="text-red-800 font-medium mb-3">
                      ¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, 'cancelled');
                          setShowDeleteConfirm(null);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
                      >
                        Sí, Cancelar Pedido
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-medium transition-all"
                      >
                        No, Volver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReceiptModal(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold">Comprobante de Transferencia</h3>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {orders.find((o) => o.id === showReceiptModal)?.transfer_receipt_url && (
                <img
                  src={orders.find((o) => o.id === showReceiptModal)?.transfer_receipt_url}
                  alt="Comprobante"
                  className="w-full rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
