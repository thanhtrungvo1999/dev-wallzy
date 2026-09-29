import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string) {
  return decodeURIComponent(String(slug || ""))
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const name = titleFromSlug(slug) || "Wallpaper";
  const url = `https://wallzy.org/category/${encodeURIComponent(slug)}`;
  return {
    title: `${name} Wallpapers | Wallzy`,
    description: `Discover ${name} wallpapers on Wallzy.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} Wallpapers | Wallzy`,
      description: `Discover ${name} wallpapers on Wallzy.`,
      url,
      type: "website",
    },
  };
}

// The app shell is mounted once by app/layout.tsx.
// Category routes only provide route metadata.
export default function CategoryPage() {
  return null;
}
