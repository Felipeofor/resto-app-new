'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

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

function storageKey(restaurantId: string) {
  return `restoqr_cart_${restaurantId}`;
}

function loadCartFromStorage(restaurantId: string): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(restaurantId));
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

function saveCartToStorage(restaurantId: string, items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(restaurantId), JSON.stringify(items));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function clearCartFromStorage(restaurantId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(restaurantId));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);

  // Track whether we've loaded from storage for the current restaurant
  const loadedForRef = useRef<string | null>(null);

  // When restaurantId is set, load persisted cart for that restaurant
  useEffect(() => {
    if (!restaurantId) return;
    if (loadedForRef.current === restaurantId) return; // already loaded
    loadedForRef.current = restaurantId;
    const saved = loadCartFromStorage(restaurantId);
    if (saved.length > 0) {
      setItems(saved);
    }
  }, [restaurantId]);

  // Persist whenever items or restaurantId change
  useEffect(() => {
    if (!restaurantId) return;
    saveCartToStorage(restaurantId, items);
  }, [items, restaurantId]);

  const setRestaurant = useCallback((newRestaurantId: string, newRestaurantSlug: string) => {
    setRestaurantId((prev) => {
      if (prev && prev !== newRestaurantId) {
        // Switching restaurants — clear in-memory cart (storage for old restaurant is untouched)
        setItems([]);
        loadedForRef.current = null;
      }
      return newRestaurantId;
    });
    setRestaurantSlug(newRestaurantSlug);
  }, []);

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
    if (restaurantId) {
      clearCartFromStorage(restaurantId);
    }
  }, [restaurantId]);

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
