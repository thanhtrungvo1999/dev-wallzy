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

  const { data, error } = await sb.from("wallpapers").select("category");
  if (error) throw error;

  const categories = [...new Set(
    (data || [])
      .map(row => String(row.category || "").trim())
      .filter(Boolean)
  )];

  return categories.find(category => categorySlug(category) === value) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return { title: "Page Not Found | Wallzy" };

  const name = category;
  const url = `https://www.wallzy.org/category/${encodeURIComponent(slug)}`;
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

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) notFound();

  return null;
}
