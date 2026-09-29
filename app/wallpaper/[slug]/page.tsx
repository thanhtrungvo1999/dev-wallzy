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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const id = wallpaperIdFromSlug(slug);
  if (!id) notFound();
  const wallpaper = await getWallpaperById(id);
  if (!wallpaper) notFound();

  const title = wallpaperTitle(wallpaper);
  const description = wallpaperDescription(wallpaper);
  const image = wallpaperImageUrl(wallpaper);
  const canonical = `https://www.wallzy.org${wallpaperPath(wallpaper)}`;

  return {
    title: `${title} - 4K UHD Wallpaper for iPhone & Android | Wallzy`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} - 4K UHD Wallpaper for iPhone & Android | Wallzy`,
      description,
      url: canonical,
      type: "article",
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - 4K UHD Wallpaper for iPhone & Android | Wallzy`,
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
  const description = wallpaperDescription(wallpaper);
  const image = wallpaperImageUrl(wallpaper);
  const url = `https://wallzy.org${wallpaperPath(wallpaper)}`;

  const imageObject = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: title,
    description,
    contentUrl: image,
    url,
    caption: title,
    representativeOfPage: true,
    creator: { "@type": "Organization", name: "Wallzy" },
    creditText: "Wallzy",
    keywords: [wallpaper.category, ...(wallpaper.keywords || [])].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(imageObject) }} />
      <WallpaperDetailShell wallpaper={wallpaper} />
    </>
  );
}
