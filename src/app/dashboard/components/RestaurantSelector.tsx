'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store, Check, Plus, Crown, Pencil, Eye } from 'lucide-react';
import { useRestaurant, type Restaurant } from '@/lib/context/restaurant-context';

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Propietario', icon: Crown, color: 'text-yellow-600 bg-yellow-50' },
  editor: { label: 'Editor', icon: Pencil, color: 'text-blue-600 bg-blue-50' },
  viewer: { label: 'Visor', icon: Eye, color: 'text-gray-600 bg-gray-50' },
};

export default function RestaurantSelector() {
  const { restaurants, currentRestaurant, setCurrentRestaurant, isLoading } = useRestaurant();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="px-3 py-2">
        <a
          href="/dashboard/settings?new=true"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Crear restaurante
        </a>
      </div>
    );
  }

  // If only one restaurant, show it without dropdown
  if (restaurants.length === 1 && currentRestaurant) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 border border-purple-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            {currentRestaurant.logo_url ? (
              <img
                src={currentRestaurant.logo_url}
                alt=""
                className="w-8 h-8 rounded-lg object-cover"
              />
            ) : (
              <Store className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {currentRestaurant.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {currentRestaurant.plan === 'pro' ? 'Plan Pro' : 'Plan Gratuito'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
          {currentRestaurant?.logo_url ? (
            <img
              src={currentRestaurant.logo_url}
              alt=""
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <Store className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {currentRestaurant?.name || 'Seleccionar'}
          </p>
          <p className="text-xs text-gray-500">
            {restaurants.length} restaurante{restaurants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          {restaurants.map((restaurant) => {
            const isSelected = restaurant.id === currentRestaurant?.id;
            const roleInfo = roleLabels[restaurant.member_role];
            const RoleIcon = roleInfo.icon;

            return (
              <button
                key={restaurant.id}
                onClick={() => {
                  setCurrentRestaurant(restaurant);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-purple-50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <Store className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {restaurant.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${roleInfo.color}`}>
                      <RoleIcon className="w-2.5 h-2.5" />
                      {roleInfo.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {restaurant.plan === 'pro' ? 'Pro' : 'Free'}
                    </span>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />}
              </button>
            );
          })}

          {/* Add restaurant */}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <a
              href="/dashboard/settings?new=true"
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-purple-600"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-dashed border-purple-300 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Agregar restaurante</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
