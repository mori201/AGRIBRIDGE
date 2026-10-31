import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { themeScript } from "@/components/layout/theme-toggle";
import { AssistantLauncher } from "@/components/assistant/launcher";
import { PwaRegister } from "@/components/layout/pwa-register";
import { SITE_NAME, SITE_URL, SLOGAN } from "@/lib/constants";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Financements, formations et marché agricole au Sénégal`, template: `%s · ${SITE_NAME}` },
  description: `${SLOGAN} AgriBridge connecte agripreneurs, producteurs, coopératives et financeurs : opportunités de financement, formations, experts, marketplace et communauté agricole.`,
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  openGraph: { type: "website", locale: "fr_SN", siteName: SITE_NAME, title: SITE_NAME, description: SLOGAN },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#18552f" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1510" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Header />
        <main id="contenu" className="min-h-[60vh]">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <AssistantLauncher loggedIn={Boolean(user)} />
        <PwaRegister />
      </body>
    </html>
  );
}
