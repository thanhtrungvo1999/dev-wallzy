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
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-CV68K011E5" strategy="lazyOnload" />
        <Script id="wallzy-gtag" strategy="lazyOnload">
          {String.raw`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-CV68K011E5');`}
        </Script>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="stylesheet" href="/css/app.css" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          media="print"
          onLoad="this.media='all'"
        />
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
