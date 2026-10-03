import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import ProductionProtection from "./components/ProductionProtection";
import GlobalTouchRipple from "./components/GlobalTouchRipple";
import GlobalSplashScreen from "./components/GlobalSplashScreen";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: true, variable: "--font-plus-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wallzy.org"),
  title: {
    default: "Wallzy - 4K UHD Wallpapers for iPhone and Android",
    template: "%s",
  },
  description: "Discover and download free 4K UHD wallpapers for iPhone and Android on Wallzy.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Wallzy",
    title: "Wallzy - 4K UHD Wallpapers",
    description: "Discover 4K UHD wallpapers on Wallzy.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  orientation: "any",
  themeColor: "#08080a",
};

export default function RootLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable}`}>
      <head>
        <Script id="wallzy-analytics" strategy="afterInteractive">
          {String.raw`(function(){var loaded=false;function load(){if(loaded)return;loaded=true;window.removeEventListener("pointerdown",load,true);window.removeEventListener("keydown",load,true);var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-CV68K011E5";document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config","G-CV68K011E5")}window.addEventListener("pointerdown",load,{once:true,capture:true});window.addEventListener("keydown",load,{once:true,capture:true});window.setTimeout(load,15000)})()`}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <Script id="wallzy-fontawesome" strategy="lazyOnload">
          {String.raw`(function(){var l=document.createElement("link");l.rel="stylesheet";l.href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";document.head.appendChild(l)})()`}
        </Script>
      </head>
      <body
        id="bodyElement"
        className="bg-[#000000] text-gray-100 min-h-screen selection:bg-white selection:text-black overflow-x-hidden font-sans overflow-hidden"
      >
        <ProductionProtection />
        <GlobalTouchRipple />
        <GlobalSplashScreen />
        {children}
        {modal}
      </body>
    </html>
  );
}
