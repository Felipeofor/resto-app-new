'use client';

import Link from 'next/link';
import {
  UtensilsCrossed,
  Settings,
  Eye,
  ArrowLeft,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RestoQR</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Iniciar Sesion
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Demo Interactiva
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Explora RestoQR
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre como funciona RestoQR con nuestro restaurante de ejemplo
            &quot;La Parrilla de Don Carlos&quot;. Navega tanto la vista de administrador
            como la vista del cliente.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin View */}
          <Link
            href="/demo/admin"
            className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-purple-300 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Vista Admin
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Explora el panel de administracion completo: estadisticas,
              gestion de menu, categorias, pedidos, emails y metricas.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'Dashboard con estadisticas',
                'Gestion de menu y categorias',
                'Vista de pedidos',
                'Emails recolectados',
                'Metricas y analiticas',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
              Explorar Panel Admin
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>

          {/* Client View */}
          <Link
            href="/menu/don-carlos"
            className="group relative bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-indigo-300 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Eye className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Vista Cliente
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Navega el menu digital tal como lo verian tus clientes al
              escanear el codigo QR del restaurante.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                'Menu digital completo',
                'Navegacion por categorias',
                'Carrito de compras',
                'Realizar pedidos',
                'Diseno mobile-first',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold group-hover:gap-3 transition-all">
              Ver Menu del Cliente
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Te gusto lo que viste? Crea tu restaurante digital ahora.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl"
          >
            Comenzar Gratis
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
