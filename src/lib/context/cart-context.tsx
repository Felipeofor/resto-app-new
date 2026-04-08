'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  notes: string;
};

type CartContextType = {
  items: CartItem[];
  restaurantId: string | null;
  restaurantSlug: string | null;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setRestaurant: (restaurantId: string, restaurantSlug: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);

  const setRestaurant = useCallback((newRestaurantId: string, newRestaurantSlug: string) => {
    if (restaurantId && restaurantId !== newRestaurantId && items.length > 0) {
      // Switching restaurants - clear cart
      setItems([]);
    }
    setRestaurantId(newRestaurantId);
    setRestaurantSlug(newRestaurantSlug);
  }, [restaurantId, items.length]);

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.menuItemId === item.menuItemId && i.notes === item.notes
      );

      if (existingItem) {
        return prevItems.map((i) =>
          i.id === existingItem.id
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      const newItem: CartItem = {
        ...item,
        id: `${item.menuItemId}-${Date.now()}`,
      };

      return [...prevItems, newItem];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === itemId ? { ...i, notes } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    restaurantId,
    restaurantSlug,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    getTotal,
    getItemCount,
    setRestaurant,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
