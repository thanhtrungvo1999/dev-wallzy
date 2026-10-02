import type { Metadata } from "next";
import TikTokPageClient from "./tiktok-page";

const title = "TikTok Photo Downloader – Download TikTok Photos | Wallzy";
const description =
  "Download photos from TikTok photo posts in high quality with Wallzy. Paste a TikTok photo post link to preview and download images on your phone.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "TikTok photo downloader",
    "download TikTok photos",
    "TikTok image downloader",
    "TikTok photo download",
    "download TikTok images",
    "TikTok downloader",
    "Wallzy TikTok downloader",
  ],
  alternates: {
    canonical: "https://www.wallzy.org/tiktok",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://www.wallzy.org/tiktok",
    siteName: "Wallzy",
    title,
    description,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.wallzy.org/tiktok#webpage",
      url: "https://www.wallzy.org/tiktok",
      name: title,
      description,
      isPartOf: {
        "@type": "WebSite",
        name: "Wallzy",
        url: "https://www.wallzy.org/",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.wallzy.org/tiktok#app",
      name: "Wallzy TikTok Photo Downloader",
      url: "https://www.wallzy.org/tiktok",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Android, iOS, Web",
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.wallzy.org/tiktok#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Wallzy",
          item: "https://www.wallzy.org/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "TikTok Photo Downloader",
          item: "https://www.wallzy.org/tiktok",
        },
      ],
    },
  ],
};

export default function TikTokPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TikTokPageClient />
    </>
  );
}
