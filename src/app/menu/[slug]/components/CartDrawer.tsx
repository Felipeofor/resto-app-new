'use client';

import { X, Plus, Minus, Trash2, MessageCircle } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { useState } from 'react';
import Link from 'next/link';


type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  restaurantSlug: string;
  deliveryFee?: number;
};

export function CartDrawer({
  isOpen,
  onClose,
  restaurantSlug,
  deliveryFee = 0,
}: CartDrawerProps) {
  const { items, removeItem, updateQuantity, updateNotes, getTotal } = useCart();
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const subtotal = getTotal();
  const total = subtotal + deliveryFee;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-600 font-medium">Tu carrito está vacío</p>
              <p className="text-sm text-gray-500 mt-2">
                Agrega algunos platos deliciosos
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-3 space-y-2"
              >
                {/* Item Header with Image */}
                <div className="flex gap-3">
                  {item.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls and Remove */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="p-1 hover:bg-white rounded transition-colors"
                      aria-label="Disminuir cantidad"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="p-1 hover:bg-white rounded transition-colors"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex-1 text-right">
                    <p className="font-semibold text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Notes Section */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedNotes(
                        expandedNotes === item.id ? null : item.id
                      )
                    }
                    className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium w-full"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Agregar nota
                  </button>

                  {expandedNotes === item.id && (
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateNotes(item.id, e.target.value)}
                      placeholder="Ej: Sin cebolla, extra salsa..."
                      className="w-full mt-2 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={2}
                    />
                  )}
                  {item.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3 sticky bottom-0 bg-white">
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

            <div className="flex justify-between border-t border-gray-200 pt-3">
              <span className="font-bold text-gray-900">Total:</span>
              <span className="font-bold text-lg text-transparent bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text">
                ${total.toFixed(2)}
              </span>
            </div>

            <Link
              href={`/menu/${restaurantSlug}/checkout`}
              onClick={onClose}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95 block text-center"
            >
              Ir al Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
