import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCategoryBySearch } from "../../lib/category-search";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryBySearch(slug);
  if (!category) return { title: "Page Not Found | Wallzy", robots: { index: false, follow: false } };

  const name = category;
  const url = `https://www.wallzy.org/category/${encodeURIComponent(slug)}`;
  return {
    title: `${name} Wallpapers | Wallzy`,
    description: `Discover ${name} 4K UHD wallpapers on Wallzy. Download original-quality wallpapers for your phone.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} Wallpapers | Wallzy`,
      description: `Discover ${name} 4K UHD wallpapers on Wallzy.`,
      url,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await resolveCategoryBySearch(slug);
  if (!category) notFound();

  const name = category;
  return (
    <section className="sr-only" aria-label={`${name} wallpapers`}>
      <h1>{name} Wallpapers</h1>
      <p>
        Discover {name} 4K UHD wallpapers on Wallzy. Browse wallpapers in this
        category and download them in original quality for your phone.
      </p>
    </section>
  );
}
