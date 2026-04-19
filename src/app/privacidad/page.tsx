import Link from "next/link";
import { UtensilsCrossed, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad · RestoQR",
  description: "Cómo RestoQR recopila, usa y protege tus datos personales.",
};

export default function PrivacidadPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RestoQR</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Política de Privacidad
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Última actualización: 18 de abril de 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p>
                En RestoQR nos tomamos en serio la privacidad de los datos.
                Esta política explica qué información recopilamos, cómo la
                usamos y qué derechos tenés sobre ella.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Datos que recopilamos
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Datos de cuenta:</strong> email, nombre del
                  restaurante, contraseña (almacenada de forma cifrada).
                </li>
                <li>
                  <strong>Datos del negocio:</strong> menú, productos, precios,
                  logo, configuración visual y datos de contacto del
                  restaurante.
                </li>
                <li>
                  <strong>Datos de uso:</strong> métricas agregadas como
                  escaneos del QR, visitas al menú, pedidos realizados y
                  emails capturados.
                </li>
                <li>
                  <strong>Datos de pago:</strong> comprobantes de transferencia
                  y referencias de pagos. No almacenamos datos de tarjetas de
                  crédito.
                </li>
                <li>
                  <strong>Datos de tus clientes finales:</strong> cuando un
                  cliente escanea el QR o hace un pedido, podemos registrar su
                  nombre, teléfono, email y dirección si los provee. Esa
                  información queda asociada a tu cuenta.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Para qué usamos tus datos
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Proveer y mantener el servicio que contrataste.</li>
                <li>Mostrar tu menú digital a tus clientes.</li>
                <li>Procesar pedidos y enviar notificaciones.</li>
                <li>
                  Mostrarte métricas agregadas sobre el uso de tu menú.
                </li>
                <li>
                  Enviar comunicaciones importantes sobre tu cuenta (facturación,
                  cambios de servicio, soporte).
                </li>
                <li>Mejorar el producto y detectar abusos o fraude.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Con quién compartimos la información
              </h2>
              <p className="mb-3">
                No vendemos tus datos. Compartimos información únicamente con
                proveedores que nos ayudan a operar el servicio:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Infraestructura:</strong> hosting y base de datos
                  (Supabase, Vercel u otros proveedores equivalentes).
                </li>
                <li>
                  <strong>Email transaccional:</strong> envío de bienvenidas y
                  notificaciones (Resend u otro proveedor similar).
                </li>
                <li>
                  <strong>Inteligencia artificial:</strong> procesamiento de
                  imágenes de menús para digitalizarlos. Las imágenes se
                  procesan de forma automática y no se utilizan para entrenar
                  modelos.
                </li>
              </ul>
              <p className="mt-3">
                También podemos compartir información si una orden judicial o
                requerimiento legal así lo exige.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Cookies y tecnologías similares
              </h2>
              <p>
                Usamos cookies estrictamente necesarias para mantener tu sesión
                iniciada y recordar tus preferencias. No usamos cookies de
                publicidad de terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Retención de datos
              </h2>
              <p>
                Conservamos tus datos mientras tengas una cuenta activa. Si
                cerrás tu cuenta, podemos conservar cierta información por un
                plazo razonable para cumplir con obligaciones legales o fiscales.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Seguridad
              </h2>
              <p>
                Aplicamos medidas técnicas y organizativas razonables para
                proteger tus datos: cifrado en tránsito (HTTPS), contraseñas
                hasheadas, control de accesos y respaldos. Ningún sistema es
                100% infalible, pero trabajamos para minimizar riesgos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Tus derechos
              </h2>
              <p className="mb-3">
                De acuerdo con la Ley 25.326 de Protección de Datos Personales
                de la República Argentina, tenés derecho a:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Acceder a los datos personales que tenemos sobre vos.</li>
                <li>Solicitar que corrijamos información inexacta.</li>
                <li>
                  Solicitar la eliminación de tus datos cuando ya no sean
                  necesarios.
                </li>
                <li>Retirar tu consentimiento en cualquier momento.</li>
              </ul>
              <p className="mt-3">
                Para ejercer estos derechos, escribinos por nuestros canales de
                contacto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Menores de edad
              </h2>
              <p>
                RestoQR está dirigido a personas mayores de 18 años o titulares
                de negocios habilitados. No recopilamos datos de menores de
                forma intencional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. Cambios en esta política
              </h2>
              <p>
                Podemos actualizar esta política ocasionalmente. La versión
                vigente siempre estará publicada en esta página. Ante cambios
                relevantes te avisaremos por email o a través del panel de
                control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                10. Contacto
              </h2>
              <p>
                Si tenés preguntas sobre esta política o querés ejercer tus
                derechos sobre tus datos, escribinos por{" "}
                <Link
                  href="/"
                  className="text-purple-700 font-semibold hover:underline"
                >
                  nuestros canales de contacto
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 bg-gray-900 text-gray-400 text-sm text-center">
        &copy; {new Date().getFullYear()} RestoQR. Todos los derechos reservados.
      </footer>
    </div>
  );
}
