import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCategoryBySearch } from "../../lib/category-search";
import { categorySlug } from "../../lib/wallpaper";
import CategoryPageClient from "../category-page-client";

type Props = { params: Promise<{ slug: string }> };

function categorySeoKeywords(category: string) {
  const name = category.trim();
  return [
    name,
    `${name} wallpaper`,
    `${name} wallpapers`,
    `${name} 4K wallpaper`,
    `${name} HD wallpaper`,
    `${name} mobile wallpaper`,
    `${name} iPhone wallpaper`,
    `${name} Android wallpaper`,
    "4K UHD wallpaper",
    "mobile wallpaper",
    "phone wallpaper",
  ];
}

function categorySeoTitle(category: string) {
  const title = `${category} Wallpapers — 4K HD Mobile Wallpapers | Wallzy`;
  return title.length <= 60
    ? title
    : `${category} Wallpapers — 4K Mobile | Wallzy`.slice(0, 60);
}

function categorySeoDescription(category: string) {
  return `Explore ${category} wallpapers in 4K and HD quality. Download high-resolution ${category} wallpapers for iPhone, Android and mobile devices from Wallzy.`
    .replace(/\s+/g, " ")
    .slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategoryBySearch(slug);
  if (!category) {
    return {
      title: "Page Not Found | Wallzy",
      robots: { index: false, follow: false },
    };
  }

  const canonicalSlug = categorySlug(category);
  const canonical = `https://www.wallzy.org/category/${canonicalSlug}`;
  const title = categorySeoTitle(category);
  const description = categorySeoDescription(category);
  const keywords = categorySeoKeywords(category);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Wallzy",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await resolveCategoryBySearch(slug);
  if (!category) notFound();

  const canonicalSlug = categorySlug(category);
  const canonical = `https://www.wallzy.org/category/${canonicalSlug}`;
  const title = categorySeoTitle(category);
  const description = categorySeoDescription(category);
  const keywords = categorySeoKeywords(category);

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical + "#collection",
    url: canonical,
    name: title,
    headline: title,
    description,
    keywords: keywords.join(", "),
    isPartOf: {
      "@type": "WebSite",
      "@id": "https://www.wallzy.org/#website",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
    publisher: {
      "@type": "Organization",
      name: "Wallzy",
      url: "https://www.wallzy.org/",
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${category} wallpapers`,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
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
        name: `${category} Wallpapers`,
        item: canonical,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <CategoryPageClient category={category} />
    </>
  );
}