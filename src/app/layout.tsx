import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "Meni Games — um intervalo gostoso";
const description = "Jogos leves para desacelerar, se divertir e exercitar a mente. Jogue Sudoku grátis, no seu ritmo, com progresso salvo.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
const socialImage = { url: '/brand/social-preview.png', width: 1200, height: 630, alt: 'Logo Meni Games com coroa dourada sobre fundo branco' };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Meni Games",
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Meni Games',
    title,
    description,
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [socialImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffdfE",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
