import type { Metadata } from "next";
import WallzyShell from "./wallzy-shell";

const HOME_TITLE = "4K UHD Wallpapers for iPhone & Android | Wallzy";
const HOME_DESCRIPTION =
  "Discover and download free 4K UHD, HD and mobile wallpapers for iPhone, Android and phone screens. Explore high-quality wallpapers by category on Wallzy.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: [
    "4K wallpapers",
    "4K UHD wallpapers",
    "HD wallpapers",
    "mobile wallpapers",
    "phone wallpapers",
    "iPhone wallpapers",
    "Android wallpapers",
    "free wallpapers",
    "4K phone wallpaper",
    "wallpaper HD",
  ],
  alternates: { canonical: "https://www.wallzy.org/" },
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
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "https://www.wallzy.org/",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default function HomePage() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.wallzy.org/#website",
    name: "Wallzy",
    url: "https://www.wallzy.org/",
    description: HOME_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.wallzy.org/search/{search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const webpage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://www.wallzy.org/#webpage",
    url: "https://www.wallzy.org/",
    name: HOME_TITLE,
    headline: HOME_TITLE,
    description: HOME_DESCRIPTION,
    isPartOf: { "@id": "https://www.wallzy.org/#website" },
    about: [
      "4K wallpapers",
      "HD wallpapers",
      "iPhone wallpapers",
      "Android wallpapers",
      "mobile wallpapers",
    ],
    keywords:
      "4K wallpapers, 4K UHD wallpapers, HD wallpapers, mobile wallpapers, phone wallpapers, iPhone wallpapers, Android wallpapers",
    publisher: {
      "@type": "Organization",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }}
      />
      <WallzyShell />
    </>
  );
}
