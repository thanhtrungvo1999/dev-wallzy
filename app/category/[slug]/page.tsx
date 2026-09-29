import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { categorySlug } from "../../lib/wallpaper";

type Props = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string) {
  return decodeURIComponent(String(slug || ""))
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function resolveCategory(slug: string) {
  const value = String(slug || "").trim().toLowerCase();
  if (!value || value === "all") return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const candidate = titleFromSlug(value).trim();
  if (!candidate) return null;

  const { data, error } = await sb
    .from("wallpapers")
    .select("category")
    .ilike("category", candidate)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.category ? String(data.category).trim() : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
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
  const category = await resolveCategory(slug);
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
