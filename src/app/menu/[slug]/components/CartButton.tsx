'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { useState } from 'react';

type CartButtonProps = {
  onCartClick: () => void;
};

export function CartButton({ onCartClick }: CartButtonProps) {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const [animate, setAnimate] = useState(false);

  if (itemCount === 0) return null;

  const handleClick = () => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 600);
    onCartClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-xl flex items-center justify-center text-white transition-all hover:shadow-2xl hover:scale-105 active:scale-95 ${
        animate ? 'animate-bounce' : ''
      }`}
      aria-label="Carrito de compras"
    >
      <ShoppingCart className="w-6 h-6" />
      <span className="absolute -top-2 -right-2 w-6 h-6 bg-purple-700 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
        {itemCount}
      </span>
    </button>
  );
}
