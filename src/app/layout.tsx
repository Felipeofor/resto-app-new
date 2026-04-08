import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestoQR - Menú Digital para Restaurantes",
  description:
    "Crea el menú digital de tu restaurante con IA. Genera códigos QR, gestiona tu carta y conecta con tus clientes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased light" data-theme="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
