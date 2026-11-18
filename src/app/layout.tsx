import type { Metadata } from 'next';
import { Atkinson_Hyperlegible, Big_Shoulders } from 'next/font/google';
import { Header } from '@/components/Header';
import './globals.css';

const display = Big_Shoulders({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-display',
  // Next no trae medidas para esta fuente; el respaldo se define a mano en globals.css.
  adjustFontFallback: false,
  fallback: ['Arial Narrow', 'sans-serif'],
});

const body = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Cuarenta B-TECH',
  description: 'Torneo de Cuarenta por parejas: equipos al azar, cuadro en vivo y reglas del torneo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body>
        <Header />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
