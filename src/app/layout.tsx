import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";

// Una sola familia: Archivo para la UI (pesos 400–700) y Archivo Black para los
// títulos de sección. next/font las descarga en build y las sirve desde el propio
// dominio, con display=swap y una reserva métricamente ajustada.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Garito",
  description: "Gestión del local Garito",
};

// viewport-fit=cover: sin esto env(safe-area-inset-*) vale siempre 0.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
