"use client";

import Link from "next/link";
import { useState } from "react";
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
  MessageCircle,
  ChevronDown,
  X,
  Minus,
  Smartphone,
} from "lucide-react";

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_RESTOQR_WHATSAPP || "5491159955385";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola! Me interesa saber mas sobre RestoQR."
)}`;

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

const howItWorks = [
  {
    icon: Camera,
    step: "01",
    title: "Sacá una foto a tu menú",
    description:
      "Desde tu celular o compu, subí una foto del menú que ya tenés (impreso, PDF o lo que sea).",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "La IA lo digitaliza",
    description:
      "En segundos, nuestra IA lee los platos, precios y categorías. Vos revisás y ajustás lo que quieras.",
  },
  {
    icon: QrCode,
    step: "03",
    title: "Compartí tu QR",
    description:
      "Descargás tu QR con tu marca e imprimís. Tus clientes escanean y ven el menú al instante.",
  },
];

const comparison = [
  {
    feature: "Se actualiza al instante",
    printed: false,
    pdf: false,
    restoqr: true,
  },
  { feature: "Recibe pedidos online", printed: false, pdf: false, restoqr: true },
  {
    feature: "Métricas de visitas y escaneos",
    printed: false,
    pdf: false,
    restoqr: true,
  },
  {
    feature: "Se ve bien en el celular",
    printed: false,
    pdf: false,
    restoqr: true,
  },
  { feature: "No se mancha ni se rompe", printed: false, pdf: true, restoqr: true },
  {
    feature: "Cambios sin reimprimir ni re-enviar",
    printed: false,
    pdf: false,
    restoqr: true,
  },
  {
    feature: "Captura emails de clientes",
    printed: false,
    pdf: false,
    restoqr: true,
  },
];

const stats = [
  { value: "< 5 min", label: "para tener tu menú online" },
  { value: "0%", label: "comisiones sobre tus ventas" },
  { value: "24/7", label: "soporte en español" },
  { value: "100%", label: "pagos directos a tu cuenta" },
];

const testimonials = [
  {
    quote:
      "Antes actualizaba el menú mandando PDFs por WhatsApp. Ahora cambio un precio y ya aparece. Me ahorra horas.",
    name: "Martín G.",
    role: "Dueño · Parrilla en Palermo",
  },
  {
    quote:
      "La captura con IA fue mágica. Le saqué una foto al menú impreso y en minutos tenía todo cargado. Solo ajusté un par de precios.",
    name: "Luciana R.",
    role: "Encargada · Café de especialidad",
  },
  {
    quote:
      "Los clientes escanean el QR y piden delivery sin llamar por teléfono. Los pagos me llegan directo, sin comisiones raras.",
    name: "Diego F.",
    role: "Pizzería barrial",
  },
];

const faqs = [
  {
    q: "¿Necesito conocimientos técnicos?",
    a: "No. Si sabés usar WhatsApp, sabés usar RestoQR. La captura con IA carga tu menú a partir de una foto, y el panel está pensado para que cualquiera lo use.",
  },
  {
    q: "¿Mis clientes necesitan descargar una app?",
    a: "No. Escanean el QR con la cámara del celular y ven el menú en el navegador al instante. Sin apps, sin instalaciones, sin logins.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. El plan Pro se paga por mes o por año y podés dejar de renovarlo cuando quieras. Si no renovás, tu cuenta vuelve al plan Gratuito y tu menú sigue online.",
  },
  {
    q: "¿Cobran comisión sobre mis ventas?",
    a: "No. RestoQR es un costo fijo mensual o anual. Los pagos de tus clientes van directo a tu cuenta bancaria por transferencia. No intermediamos ni cobramos por pedido.",
  },
  {
    q: "¿En qué moneda son los precios?",
    a: "Los precios están expresados en pesos argentinos (ARS). Si estás fuera de Argentina, escribinos por WhatsApp y coordinamos el pago.",
  },
  {
    q: "¿Puedo usar mi dominio y mi marca?",
    a: "Sí. Personalizás colores, logo y la URL de tu menú. En el plan Pro también podés usar un dominio propio bajo pedido.",
  },
];

const plans = [
  {
    name: "Gratuito",
    price: "$0",
    currency: "ARS",
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
    currency: "ARS",
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
    currency: "ARS",
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      <div className="absolute -inset-6 bg-gradient-to-tr from-purple-400/30 to-indigo-400/30 blur-3xl rounded-full" />
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2.5 shadow-2xl ring-1 ring-black/10">
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-xl z-10" />
        <div className="bg-white rounded-[2rem] overflow-hidden h-[540px] flex flex-col">
          <div className="p-4 pt-7 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">
                  La Parrilla de Don Carlos
                </h3>
                <p className="text-[10px] text-purple-100">
                  Parrilla · Comida argentina
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 overflow-hidden">
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                Parrilla
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                Entradas
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                Bebidas
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-3 space-y-2.5 bg-gray-50">
            {[
              { name: "Bife de chorizo", desc: "400g con guarnición", price: "$8.500" },
              { name: "Vacío a la parrilla", desc: "Corte tierno con chimichurri", price: "$7.200" },
              { name: "Provoleta", desc: "Queso provolone a la parrilla", price: "$3.800" },
              { name: "Empanadas (x3)", desc: "Carne, pollo o jamón y queso", price: "$2.400" },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-200 to-amber-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">{item.desc}</p>
                  <p className="text-xs font-bold text-purple-600 mt-0.5">
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold text-center py-2.5 rounded-full">
              Hacer pedido
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center text-xs sm:text-sm py-2 px-4">
        <span className="font-medium">
          🎁 Empezá gratis. Sin tarjeta de crédito. Cancelá cuando quieras.
        </span>
      </div>

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
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#como-funciona" className="hover:text-gray-900 transition-colors">
                Cómo funciona
              </a>
              <a href="#precios" className="hover:text-gray-900 transition-colors">
                Precios
              </a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">
                Preguntas
              </a>
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
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white pt-16 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/40 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Potenciado con Inteligencia Artificial
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
                Tu menú digital en{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  minutos
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Sacá una foto de tu menú, nuestra IA lo digitaliza y te damos un
                QR para compartir con tus clientes. Sin apps, sin complicaciones.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-7 py-3.5 rounded-full transition-all shadow-lg hover:shadow-xl"
                >
                  Comenzar Gratis
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/menu/don-carlos"
                  className="inline-flex items-center justify-center gap-2 text-base sm:text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 px-7 py-3.5 rounded-full transition-all border border-gray-200 shadow-sm"
                >
                  <Smartphone className="w-5 h-5" />
                  Ver menú de ejemplo
                </Link>
              </div>
              <div className="mt-6 flex items-center gap-4 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  Sin tarjeta
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  Setup en 5 min
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  Cancelás cuando quieras
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-white to-purple-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              ¿CÓMO FUNCIONA?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Tres pasos. Cinco minutos.
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Sin aprender nada nuevo. Si tenés un celular, ya sabés cómo usarlo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-5xl font-bold text-gray-100">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 lg:-right-5 -translate-y-1/2 w-8 h-8 bg-white rounded-full border border-gray-100 shadow-sm items-center justify-center z-10">
                    <ChevronRight className="w-5 h-5 text-purple-600" />
                  </div>
                )}
              </div>
            ))}
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

      {/* Comparison */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              ¿Por qué no seguir con lo de siempre?
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Así se compara RestoQR con las alternativas tradicionales.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-4 gap-0 text-center border-b border-gray-100 bg-gray-50">
              <div className="p-4 text-left text-sm font-semibold text-gray-700">
                Característica
              </div>
              <div className="p-4 text-sm font-semibold text-gray-600">
                Carta impresa
              </div>
              <div className="p-4 text-sm font-semibold text-gray-600">
                PDF por WhatsApp
              </div>
              <div className="p-4 text-sm font-bold text-purple-700 bg-purple-50">
                RestoQR
              </div>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 gap-0 text-center ${
                  i < comparison.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="p-4 text-left text-sm text-gray-700">
                  {row.feature}
                </div>
                <div className="p-4 flex justify-center">
                  {row.printed ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="p-4 flex justify-center">
                  {row.pdf ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="p-4 flex justify-center bg-purple-50/50">
                  {row.restoqr ? (
                    <Check className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Star className="w-3.5 h-3.5" />
              LO QUE DICEN
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Restaurantes como el tuyo, cambiándole la cara al menú
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gradient-to-b from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Planes simples y transparentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Precios en pesos argentinos (ARS). Empezá gratis, escalá cuando quieras.
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
                {"isAnnual" in plan && plan.isAnnual && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-green-400 text-green-900 px-4 py-1 rounded-full text-sm font-semibold">
                    2 meses gratis
                  </div>
                )}
                <h3
                  className={`text-lg font-semibold ${plan.highlighted ? "text-purple-100" : "text-gray-600"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span
                    className={`text-xs font-semibold ${plan.highlighted ? "text-purple-200" : "text-gray-400"}`}
                  >
                    {plan.currency}
                  </span>
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
          <p className="mt-10 text-center text-sm text-gray-500">
            ¿Tenés dudas sobre qué plan te conviene?{" "}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-700 font-semibold hover:underline"
            >
              Escribinos por WhatsApp
            </a>
            .
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Lo que los dueños suelen preguntar antes de empezar.
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={faq.q}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-gray-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600">
              ¿Tu pregunta no está acá?{" "}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                Preguntanos por WhatsApp
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Tu próximo cliente ya está escaneando un QR.
          </h2>
          <p className="mt-4 text-lg sm:text-xl text-purple-100 max-w-2xl mx-auto">
            Subí tu menú en 5 minutos y empezá a recibir pedidos hoy mismo. Sin
            tarjeta, sin compromiso.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-purple-700 bg-white hover:bg-purple-50 px-8 py-4 rounded-full transition-all shadow-lg"
            >
              Comenzar Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/menu/don-carlos"
              className="inline-flex items-center justify-center gap-2 text-lg font-semibold text-white bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full transition-all border border-white/20 backdrop-blur-sm"
            >
              <Smartphone className="w-5 h-5" />
              Ver menú de ejemplo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">RestoQR</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs mb-4">
                Menú digital con QR para restaurantes. Potenciado con IA.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contactanos
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a href="#precios" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Preguntas
                  </a>
                </li>
                <li>
                  <Link href="/menu/don-carlos" className="hover:text-white transition-colors">
                    Menú de ejemplo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Crear cuenta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>
              &copy; {new Date().getFullYear()} RestoQR. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-5">
              <Link href="/terminos" className="hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
