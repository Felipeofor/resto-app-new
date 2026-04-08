'use client';

import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { useState } from 'react';

type AddToCartButtonProps = {
  menuItemId: string;
  name: string;
  price: number;
  image_url: string | null;
};

export function AddToCartButton({
  menuItemId,
  name,
  price,
  image_url,
}: AddToCartButtonProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [localQuantity, setLocalQuantity] = useState(1);

  const cartItem = items.find((i) => i.menuItemId === menuItemId && i.notes === '');

  const handleAdd = () => {
    if (!cartItem) {
      addItem({
        menuItemId,
        name,
        price,
        quantity: localQuantity,
        image_url,
        notes: '',
      });
      setLocalQuantity(1);
    }
  };

  const handleIncrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  };

  if (cartItem) {
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg p-1 border border-purple-200">
        <button
          onClick={handleDecrease}
          className="p-1.5 hover:bg-white rounded-md transition-colors"
          aria-label="Disminuir cantidad"
        >
          <Minus className="w-4 h-4 text-purple-600" />
        </button>
        <span className="w-8 text-center text-sm font-bold text-purple-700">
          {cartItem.quantity}
        </span>
        <button
          onClick={handleIncrease}
          className="p-1.5 hover:bg-white rounded-md transition-colors"
          aria-label="Aumentar cantidad"
        >
          <Plus className="w-4 h-4 text-purple-600" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
      aria-label={`Agregar ${name} al carrito`}
    >
      <Plus className="w-4 h-4" />
      Agregar
    </button>
  );
}
