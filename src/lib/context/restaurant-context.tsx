'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: 'free' | 'pro';
  member_role: 'owner' | 'editor' | 'viewer';
}

interface RestaurantContextType {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurants: [],
  currentRestaurant: null,
  setCurrentRestaurant: () => {},
  isLoading: true,
  refetch: async () => {},
});

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurantState] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRestaurants([]);
        setCurrentRestaurantState(null);
        setIsLoading(false);
        return;
      }

      // Check if user is super_admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'super_admin') {
        // Super admin sees all restaurants
        const { data } = await supabase
          .from('restaurants')
          .select('id, name, slug, logo_url, plan')
          .order('name');

        const mapped: Restaurant[] = (data || []).map(r => ({
          ...r,
          member_role: 'owner' as const,
        }));
        setRestaurants(mapped);

        // Restore last selected or pick first
        const savedId = typeof window !== 'undefined'
          ? localStorage.getItem('currentRestaurantId')
          : null;
        const saved = mapped.find(r => r.id === savedId);
        setCurrentRestaurantState(saved || mapped[0] || null);
      } else {
        // Regular admin: get restaurants via membership
        const { data } = await supabase
          .from('restaurant_members')
          .select(`
            member_role,
            restaurants:restaurant_id (
              id, name, slug, logo_url, plan
            )
          `)
          .eq('user_id', user.id);

        const mapped: Restaurant[] = (data || []).map((m: any) => ({
          id: m.restaurants.id,
          name: m.restaurants.name,
          slug: m.restaurants.slug,
          logo_url: m.restaurants.logo_url,
          plan: m.restaurants.plan,
          member_role: m.member_role,
        }));
        setRestaurants(mapped);

        const savedId = typeof window !== 'undefined'
          ? localStorage.getItem('currentRestaurantId')
          : null;
        const saved = mapped.find(r => r.id === savedId);
        setCurrentRestaurantState(saved || mapped[0] || null);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setCurrentRestaurant = useCallback((restaurant: Restaurant) => {
    setCurrentRestaurantState(restaurant);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentRestaurantId', restaurant.id);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        currentRestaurant,
        setCurrentRestaurant,
        isLoading,
        refetch: fetchRestaurants,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
