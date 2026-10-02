import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient from "./category-page";
import { getCategoryPageData } from "../../lib/category-server";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) {
    return {
      title: "Page Not Found | Wallzy",
      robots: { index: false, follow: false },
    };
  }

  const url = `https://www.wallzy.org/category/${encodeURIComponent(slug)}`;
  return {
    title: `${data.category} Wallpapers | Wallzy`,
    description: `Discover ${data.category} 4K UHD wallpapers on Wallzy. Download original-quality wallpapers for your phone.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${data.category} Wallpapers | Wallzy`,
      description: `Discover ${data.category} 4K UHD wallpapers on Wallzy.`,
      url,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryPageData(slug);

  if (!data) notFound();

  return (
    <CategoryPageClient
      category={data.category}
      categories={data.categories}
      initialItems={data.items}
    />
  );
}
