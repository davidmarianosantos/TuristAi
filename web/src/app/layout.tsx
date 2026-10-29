import type { Metadata, Viewport } from "next";
import { Inter, Slackey } from "next/font/google";
import "./globals.css";

// Inter no texto; Slackey (pedido da equipe) só nos títulos principais das seções.
const inter = Inter({
  variable: "--font-app",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const slackey = Slackey({
  variable: "--font-display-app",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "TuristAí · Costa do Cacau",
  description: "Alertas oficiais, praias, lugares verificados e SOS no seu idioma.",
};

export const viewport: Viewport = {
  themeColor: "#0b4f6c",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o navegador do celular injeta atributos no <html> (ex.: __gcrremoteframetoken) antes do React
    <html lang="pt-BR" className={`${inter.variable} ${slackey.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
