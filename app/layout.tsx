import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import WallzyShellClient from "./wallzy-shell-client";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: true, variable: "--font-plus-jakarta" });

const WALLZY_FA_CSS = `/* Wallzy minimal Font Awesome 6.4.0 */
@font-face{font-family:"Font Awesome 6 Brands";font-style:normal;font-weight:400;font-display:swap;src:url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2) format("woff2"),url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.ttf) format("truetype")}
@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:400;font-display:swap;src:url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2) format("woff2"),url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.ttf) format("truetype")}
@font-face{font-family:"Font Awesome 6 Free";font-style:normal;font-weight:900;font-display:swap;src:url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2) format("woff2"),url(https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.ttf) format("truetype")}
.fa,.fa-brands,.fa-classic,.fa-regular,.fa-solid,.fab,.far,.fas{display:inline-block;font-style:normal;font-variant:normal;line-height:1;text-rendering:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.fa-solid,.fas{font-family:"Font Awesome 6 Free";font-weight:900}
.fa-regular,.far{font-family:"Font Awesome 6 Free";font-weight:400}
.fa-brands,.fab{font-family:"Font Awesome 6 Brands";font-weight:400}
.fa-android:before{content:"\\f17b"}
.fa-apple:before{content:"\\f179"}
.fa-google:before{content:"\\f1a0"}
.fa-tiktok:before{content:"\\e07b"}
.fa-clock-four:before,.fa-clock:before{content:"\\f017"}
.fa-compass:before{content:"\\f14e"}
.fa-heart:before{content:"\\f004"}
.fa-arrow-left:before{content:"\\f060"}
.fa-arrow-right:before{content:"\\f061"}
.fa-bookmark:before{content:"\\f02e"}
.fa-cloud:before{content:"\\f0c2"}
.fa-download:before{content:"\\f019"}
.fa-home-alt:before,.fa-home-lg-alt:before,.fa-home:before,.fa-house:before{content:"\\f015"}
.fa-chain-broken:before,.fa-chain-slash:before,.fa-link-slash:before,.fa-unlink:before{content:"\\f127"}
.fa-magnifying-glass:before,.fa-search:before{content:"\\f002"}
.fa-mobile-android-alt:before,.fa-mobile-screen:before{content:"\\f3cf"}
.fa-mobile-alt:before,.fa-mobile-screen-button:before{content:"\\f3cd"}
.fa-palette:before{content:"\\f53f"}
.fa-right-from-bracket:before,.fa-sign-out-alt:before{content:"\\f2f5"}
.fa-redo-alt:before,.fa-rotate-forward:before,.fa-rotate-right:before{content:"\\f2f9"}
.fa-share-alt:before,.fa-share-nodes:before{content:"\\f1e0"}
.fa-spinner:before{content:"\\f110"}
.fa-trash:before{content:"\\f1f8"}
.fa-circle-user:before,.fa-user-circle:before{content:"\\f2bd"}
.fa-wifi-3:before,.fa-wifi-strong:before,.fa-wifi:before{content:"\\f1eb"}
.fa-close:before,.fa-multiply:before,.fa-remove:before,.fa-times:before,.fa-xmark:before{content:"\\f00d"}`;

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
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="" />
        <style dangerouslySetInnerHTML={{ __html: WALLZY_FA_CSS }} />
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
