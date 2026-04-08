import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestoQR - Menú Digital para Restaurantes",
  description:
    "Crea el menú digital de tu restaurante con IA. Genera códigos QR, gestiona tu carta y conecta con tus clientes.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192" },
    ],
  },
  themeColor: "#7c3aed",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RestoQR",
  },
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
