import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CategoryPageClient from "../category-page-client";
import { resolveCategoryBySearch } from "../../lib/category-search";
import { getCategoryWallpapers } from "../../lib/category-data";

export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

const getResolvedCategory = cache(async (slug: string) => {
  return resolveCategoryBySearch(slug);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getResolvedCategory(slug);

  if (!category) {
    return {
      title: "Page Not Found | Wallzy",
      robots: { index: false, follow: false },
    };
  }

  const url = `https://www.wallzy.org/category/${encodeURIComponent(slug)}`;

  return {
    title: `${category} Wallpapers | Wallzy`,
    description: `Discover ${category} 4K UHD wallpapers on Wallzy. Download original-quality wallpapers for your phone.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${category} Wallpapers | Wallzy`,
      description: `Discover ${category} 4K UHD wallpapers on Wallzy.`,
      url,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getResolvedCategory(slug);

  if (!category) notFound();

  const items = await getCategoryWallpapers(category);

  return (
    <>
      <section className="sr-only" aria-label={`${category} wallpapers`}>
        <h1>${category} Wallpapers</h1>
        <p>
          Discover ${category} 4K UHD wallpapers on Wallzy. Browse wallpapers in
          this category and download them in original quality for your phone.
        </p>
      </section>
      <CategoryPageClient category={category} initialItems={items} />
    </>
  );
}
