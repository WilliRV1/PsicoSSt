import type { Metadata } from "next";
import { Barlow_Semi_Condensed, IBM_Plex_Sans, IBM_Plex_Mono, Source_Serif_4, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Las mismas dos familias que componen los PDF. Se cargan aquí para que la
// vista previa de un informe en pantalla sea el documento y no una versión
// parecida: si la previa usa otra tipografía, el usuario ve dos documentos
// distintos y descubre el definitivo sólo al descargarlo.
const reportSerif = Source_Serif_4({
  variable: "--font-report-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

const reportSans = Inter({
  variable: "--font-report-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PsicoSST — Batería de Riesgo Psicosocial",
  description: "Plataforma profesional para la aplicación de la Batería de Riesgo Psicosocial en Colombia",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${barlow.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${reportSerif.variable} ${reportSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" duration={5500} />
        </ThemeProvider>
      </body>
    </html>
  );
}
