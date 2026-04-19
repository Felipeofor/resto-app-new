import Link from "next/link";
import { UtensilsCrossed, ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones · RestoQR",
  description: "Términos y condiciones de uso de RestoQR.",
};

export default function TerminosPage() {
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
            Términos y Condiciones
          </h1>
          <p className="text-sm text-gray-500 mb-10">
            Última actualización: 18 de abril de 2026
          </p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p>
                Bienvenido a RestoQR. Al acceder o utilizar nuestros servicios,
                aceptás los siguientes términos y condiciones. Te pedimos que
                los leas con atención antes de usar la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. ¿Qué es RestoQR?
              </h2>
              <p>
                RestoQR es una plataforma que permite a restaurantes y negocios
                gastronómicos crear un menú digital accesible mediante código
                QR, recibir pedidos online, gestionar finanzas básicas y capturar
                datos de sus clientes. El servicio se ofrece a través de planes
                gratuitos y pagos (&ldquo;Pro Mensual&rdquo; y &ldquo;Pro Anual&rdquo;).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Cuenta y registro
              </h2>
              <p>
                Para usar RestoQR debés crear una cuenta con un email válido.
                Sos responsable de mantener la confidencialidad de tus
                credenciales y de todas las actividades realizadas desde tu
                cuenta. Debés notificarnos de inmediato ante cualquier uso no
                autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Planes y pagos
              </h2>
              <p>
                Los precios publicados están expresados en pesos argentinos
                (ARS) salvo que se indique lo contrario. El plan Gratuito no
                requiere pago. Los planes Pro se abonan por adelantado (mensual
                o anual) por transferencia bancaria u otro método habilitado.
                No cobramos comisión sobre las ventas de tu restaurante. Los
                pagos de tus clientes van directamente a la cuenta bancaria que
                vos definas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Renovación y cancelación
              </h2>
              <p>
                Podés dejar de renovar tu plan Pro cuando quieras. Si no
                renovás, tu cuenta vuelve al plan Gratuito al finalizar el
                período abonado. Los pagos realizados no son reembolsables
                salvo en los casos previstos por la legislación vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Uso aceptable
              </h2>
              <p>
                Te comprometés a no utilizar RestoQR para actividades ilegales,
                fraudulentas, ofensivas o que vulneren derechos de terceros.
                Nos reservamos el derecho de suspender o dar de baja cuentas
                que incumplan estos términos, sin aviso previo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Contenido del usuario
              </h2>
              <p>
                Todo el contenido que cargues en la plataforma (nombres de
                productos, descripciones, imágenes, logos, etc.) es de tu
                propiedad o contás con autorización para usarlo. Nos otorgás
                una licencia limitada para mostrar ese contenido como parte del
                servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Disponibilidad del servicio
              </h2>
              <p>
                Hacemos nuestro mejor esfuerzo para mantener RestoQR disponible
                de forma continua, pero no garantizamos un funcionamiento libre
                de interrupciones. Podemos realizar tareas de mantenimiento
                programado y actualizaciones sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Limitación de responsabilidad
              </h2>
              <p>
                En la máxima medida permitida por la ley, RestoQR no será
                responsable por daños indirectos, lucro cesante, pérdida de
                datos o pérdida de oportunidad comercial derivados del uso o
                imposibilidad de uso del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. Modificaciones
              </h2>
              <p>
                Podemos modificar estos términos en cualquier momento. La
                versión vigente será la publicada en esta página. Te avisaremos
                sobre cambios significativos por email o mediante una
                notificación en el panel de control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                10. Ley aplicable y jurisdicción
              </h2>
              <p>
                Estos términos se rigen por las leyes de la República
                Argentina. Ante cualquier controversia, las partes se someten a
                los tribunales ordinarios competentes de la Ciudad Autónoma de
                Buenos Aires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                11. Contacto
              </h2>
              <p>
                Si tenés dudas sobre estos términos, escribinos por{" "}
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
