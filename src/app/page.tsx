"use client";

import Link from "next/link";
import {
  UtensilsCrossed,
  QrCode,
  Camera,
  Mail,
  BarChart3,
  Sparkles,
  ChevronRight,
  Check,
  Star,
  ShoppingBag,
  Wallet,
  Wrench,
} from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "Captura con IA",
    description:
      "Toma fotos de tu menu fisico y nuestra IA lo digitaliza automaticamente. Sin escribir nada.",
  },
  {
    icon: QrCode,
    title: "QR Personalizado",
    description:
      "Genera codigos QR unicos con los colores de tu marca. Tus clientes escanean y ven el menu al instante.",
  },
  {
    icon: ShoppingBag,
    title: "Pedidos y Delivery",
    description:
      "Recibe pedidos online con seguimiento, pagos por transferencia y notificaciones automaticas.",
  },
  {
    icon: Wallet,
    title: "Control de Finanzas",
    description:
      "Registra ingresos y egresos, visualiza tu balance mensual y exporta reportes a CSV.",
  },
  {
    icon: Mail,
    title: "Captura de Emails",
    description:
      "Recolecta emails con incentivos personalizados y envia bienvenidas automaticas.",
  },
  {
    icon: BarChart3,
    title: "Metricas en Tiempo Real",
    description:
      "Escaneos QR, visitas al menu, emails registrados y tendencias por dia.",
  },
  {
    icon: Sparkles,
    title: "Personalizacion Total",
    description:
      "Colores de marca, logo, vista de menu (lista o grilla) y mensajes personalizados.",
  },
  {
    icon: Wrench,
    title: "Soluciones a Medida",
    description:
      "Tienda virtual, gestion de mesas, app propia, facturacion y mas. Desarrollo personalizado.",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: "$0",
    period: "/mes",
    description: "Perfecto para empezar",
    features: [
      "Menu digital con QR",
      "Hasta 100 productos",
      "Codigo QR personalizable",
      "Control de finanzas basico",
      "Colores y logo de tu marca",
    ],
    cta: "Comenzar Gratis",
    highlighted: false,
  },
  {
    name: "Pro Mensual",
    price: "$5.000",
    period: "/mes",
    description: "Todo lo que necesitas para crecer",
    features: [
      "Todo del plan Gratuito",
      "Productos ilimitados con fotos HD",
      "Captura de menu con IA",
      "Sistema de pedidos y delivery",
      "Metricas y analytics completo",
      "Captura de emails + bienvenida automatica",
      "Finanzas con desglose y exportar CSV",
      "Soporte prioritario",
    ],
    cta: "Comenzar con Pro",
    highlighted: true,
  },
  {
    name: "Pro Anual",
    price: "$50.000",
    period: "/año",
    description: "2 meses gratis - el mejor valor",
    features: [
      "Todo del plan Pro Mensual",
      "Ahorras $10.000 por año",
      "365 dias de acceso garantizado",
      "Acceso anticipado a nuevas features",
    ],
    cta: "Ahorrar con Plan Anual",
    highlighted: false,
    isAnnual: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RestoQR</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Iniciar Sesión
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

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Potenciado con Inteligencia Artificial
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Tu menú digital en{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              minutos
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Digitaliza la carta de tu restaurante con IA, genera códigos QR y
            conecta con tus clientes. Sin complicaciones.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl"
            >
              Comenzar Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 px-8 py-4 rounded-full transition-all border border-gray-200 shadow-sm"
            >
              Ver Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Todo lo que necesita tu restaurante
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Menu digital, pedidos, finanzas y mas. Una sola plataforma para
              gestionar todo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <feature.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Planes simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Empieza gratis, escala cuando quieras.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-purple-600 to-indigo-700 text-white shadow-2xl scale-105"
                    : "bg-white border border-gray-200 shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                    <Star className="w-3.5 h-3.5" />
                    Popular
                  </div>
                )}
                {(plan as any).isAnnual && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-green-400 text-green-900 px-4 py-1 rounded-full text-sm font-semibold">
                    2 meses gratis
                  </div>
                )}
                <h3
                  className={`text-lg font-semibold ${plan.highlighted ? "text-purple-100" : "text-gray-600"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={
                      plan.highlighted ? "text-purple-200" : "text-gray-500"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm ${plan.highlighted ? "text-purple-200" : "text-gray-500"}`}
                >
                  {plan.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-purple-200" : "text-purple-600"}`}
                      />
                      <span className={`text-sm ${plan.highlighted ? "text-purple-100" : "text-gray-700"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full text-center py-3 px-6 rounded-full font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-white text-purple-700 hover:bg-purple-50 shadow-lg"
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">RestoQR</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} RestoQR. Todos los derechos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
