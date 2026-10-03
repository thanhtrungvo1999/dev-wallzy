import type { Metadata } from "next";
import TikTokPageClient from "./tiktok-page";

const TITLE = "TikTok Photo Downloader — Download TikTok Photos | Wallzy";
const DESCRIPTION =
  "Download photos from TikTok photo posts with Wallzy. Fast, simple TikTok photo downloader for saving high-quality images on iPhone, Android and mobile devices.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "TikTok downloader",
    "TikTok photo downloader",
    "download TikTok photos",
    "TikTok image downloader",
    "TikTok pictures downloader",
    "save TikTok photos",
    "TikTok photo download",
    "TikTok downloader iPhone",
    "TikTok downloader Android",
  ],
  alternates: { canonical: "https://www.wallzy.org/tiktok" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  openGraph: {
    type: "website",
    siteName: "Wallzy",
    title: TITLE,
    description: DESCRIPTION,
    url: "https://www.wallzy.org/tiktok",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function TikTokPage() {
  const pageUrl = "https://www.wallzy.org/tiktok";

  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl + "#webpage",
    url: pageUrl,
    name: TITLE,
    headline: TITLE,
    description: DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://www.wallzy.org/#website",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
    keywords:
      "TikTok downloader, TikTok photo downloader, download TikTok photos, TikTok image downloader, save TikTok photos",
    publisher: {
      "@type": "Organization",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Wallzy TikTok Photo Downloader",
    url: pageUrl,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "iOS, Android, Web",
    description: DESCRIPTION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Wallzy", item: "https://www.wallzy.org/" },
      { "@type": "ListItem", position: 2, name: "TikTok Photo Downloader", item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <TikTokPageClient />
    </>
  );
}
