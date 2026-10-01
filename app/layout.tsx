import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import WallzyShellClient from "./wallzy-shell-client";

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
  themeColor: "#08080a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${plusJakartaSans.variable}`}>
      <head>
        <Script id="wallzy-analytics" strategy="afterInteractive">
          {String.raw`(function(){var loaded=false;function load(){if(loaded)return;loaded=true;window.removeEventListener("pointerdown",load,true);window.removeEventListener("keydown",load,true);var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=G-CV68K011E5";document.head.appendChild(s);window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config","G-CV68K011E5")}window.addEventListener("pointerdown",load,{once:true,capture:true});window.addEventListener("keydown",load,{once:true,capture:true});window.setTimeout(load,15000)})()`}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preload" as="image" href="/icons/icon-512.svg" fetchPriority="high" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
        <Script id="wallzy-fontawesome" strategy="afterInteractive">{String.raw`(function(){if(document.getElementById("wallzy-fontawesome-css"))return;var l=document.createElement("link");l.id="wallzy-fontawesome-css";l.rel="stylesheet";l.href="/css/fontawesome.min.css";document.head.appendChild(l)})()`}</Script>
      </head>
      <body
        id="bodyElement"
        className="bg-[#000000] text-gray-100 min-h-screen selection:bg-white selection:text-black overflow-x-hidden font-sans overflow-hidden"
      >
        <WallzyShellClient />
        {children}
      </body>
    </html>
  );
}
