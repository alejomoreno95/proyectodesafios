import type { Metadata } from "next";
import { Newsreader, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Newsreader, Figtree y JetBrains Mono son fuentes variables en Google
// Fonts — se cargan sin "weight" (rango completo) en vez de una lista de
// pesos fijos. Con Turbopack (default desde Next 16), pedir varios pesos
// de una fuente variable rompe el build ("next/font/google queries have
// exactly one entry"); sin "weight" se evita ese bug y además es lo que
// recomienda la documentación de next/font para fuentes variables.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proyecto Desafíos — CSME",
  description: "Libro de temas digital del Proyecto Desafíos, CSME.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${newsreader.variable} ${figtree.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
