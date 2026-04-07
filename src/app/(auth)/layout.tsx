import React from 'react';
import { UtensilsCrossed } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-md mx-auto px-4 py-6 flex items-center justify-center gap-2">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
            RestaurantHub
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-purple-100 py-4 text-center text-sm text-gray-600">
        <p>© 2026 RestaurantHub. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
