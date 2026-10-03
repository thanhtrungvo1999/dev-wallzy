import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WallpaperDetailShell from "./detail-shell";
import {
  getWallpaperById,
  wallpaperDescription,
  wallpaperIdFromSlug,
  wallpaperImageUrl,
  wallpaperPath,
  wallpaperTitle,
} from "../../lib/wallpaper";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

function cleanKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) return [];
  return [...new Set(
    keywords
      .map((keyword) => String(keyword || "").trim().replace(/\s+/g, " "))
      .filter((keyword) => keyword.length >= 2 && keyword.length <= 80)
  )].slice(0, 12);
}

function seoTitle(title: string, category: string, keywords: string[]) {
  const keywordPart = keywords.slice(0, 2).join(" & ");
  const base = keywordPart ? `${title} — ${keywordPart}` : title;
  return `${base} | ${category || "4K"} Wallpaper | Wallzy`.slice(0, 60);
}

function seoDescription(category: string, keywords: string[], fallback: string) {
  const keywordPart = keywords.slice(0, 6).join(", ");
  const text = keywordPart
    ? `Download ${category || "4K"} wallpaper in high quality for iPhone, Android and mobile. Explore this wallpaper featuring ${keywordPart} on Wallzy.`
    : fallback;
  return text.replace(/\s+/g, " ").trim().slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = wallpaperIdFromSlug(slug);
  if (!id) notFound();

  const wallpaper = await getWallpaperById(id);
  if (!wallpaper) notFound();

  const title = wallpaperTitle(wallpaper);
  const category = String(wallpaper.category || "Wallpaper").trim();
  const keywords = cleanKeywords(wallpaper.keywords);
  const description = seoDescription(category, keywords, wallpaperDescription(wallpaper));
  const metaTitle = seoTitle(title, category, keywords);
  const image = wallpaperImageUrl(wallpaper);
  const canonical = `https://www.wallzy.org${wallpaperPath(wallpaper)}`;

  return {
    title: metaTitle,
    description,
    keywords: [category, ...keywords, "4K wallpaper", "mobile wallpaper", "iPhone wallpaper", "Android wallpaper"],
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title: metaTitle,
      description,
      url: canonical,
      type: "article",
      siteName: "Wallzy",
      images: image ? [{ url: image, width: 360, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function WallpaperPage({ params }: Props) {
  const { slug } = await params;
  const id = wallpaperIdFromSlug(slug);
  if (!id) notFound();

  const wallpaper = await getWallpaperById(id);
  if (!wallpaper) notFound();

  const title = wallpaperTitle(wallpaper);
  const category = String(wallpaper.category || "Wallpaper").trim();
  const keywords = cleanKeywords(wallpaper.keywords);
  const description = seoDescription(category, keywords, wallpaperDescription(wallpaper));
  const image = wallpaperImageUrl(wallpaper);
  const url = `https://www.wallzy.org${wallpaperPath(wallpaper)}`;
  const originalUrl = String(wallpaper.public_url || "").trim();

  const imageObject = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: title,
    headline: title,
    description,
    contentUrl: originalUrl || image,
    thumbnailUrl: image || originalUrl,
    url,
    caption: title,
    representativeOfPage: true,
    keywords: [category, ...keywords].filter(Boolean).join(", "),
    creator: { "@type": "Organization", name: "Wallzy" },
    creditText: "Wallzy",
    license: "https://www.wallzy.org/terms",
    acquireLicensePage: "https://www.wallzy.org/terms",
    copyrightNotice: "Wallzy",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
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
        name: category,
        item: `https://www.wallzy.org/category/${encodeURIComponent(category.toLowerCase().replace(/\\s+/g, "-"))}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: url,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObject) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <WallpaperDetailShell wallpaper={wallpaper} />
    </>
  );
}
