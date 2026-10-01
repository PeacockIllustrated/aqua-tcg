import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import "./globals.css";
import { PageFooter } from "@/components/wireframe/PageFooter";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { brand } from "@/lib/brand";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "700"],
});

const title = `${brand.name} · buy & sell Pokémon cards`;

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  icons: { icon: brand.logo },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title,
    description: brand.description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: brand.description,
  },
  formatDetection: { telephone: false, email: false, address: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme={brand.theme}
      suppressHydrationWarning
      className={`${archivoBlack.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans text-[15px] leading-[1.55]">
        <main className="flex-1 overflow-x-clip">{children}</main>
        <PageFooter />
        {brand.demoMode ? <ThemeSwitcher initial={brand.theme} /> : null}
      </body>
    </html>
  );
}
