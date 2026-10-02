import { createClient } from "@supabase/supabase-js";

function categorySlug(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeWallpaper(row: any) {
  const r2 = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.wallzy.org").replace(/\/+$/, "");
  const transform = (
    process.env.NEXT_PUBLIC_IMAGE_TRANSFORM_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://img.wallzy.org"
  ).replace(/\/+$/, "");
  const path = String(row?.storage_path || "").trim();
  const originalUrl = path
    ? path.startsWith("http://") || path.startsWith("https://")
      ? path
      : r2 + "/" + path.replace(/^\/+/, "")
    : String(row?.public_url || row?.url || "");
  const url = originalUrl
    ? `${transform}/cdn-cgi/image/width=240,quality=30,format=auto/${originalUrl}`
    : "";

  return {
    id: String(row?.id ?? ""),
    url,
    original_url: originalUrl,
    title: row?.title || row?.name || "",
    category: row?.category || "Other",
    keywords: Array.isArray(row?.keywords) ? row.keywords : [],
    timestamp: row?.created_at || row?.timestamp || "",
    storage_path: row?.storage_path || "",
  };
}

export async function getCategoryPageData(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("*");

  if (categoryError) throw categoryError;

  const categories = (categoryRows || [])
    .map((row: any) => String(row?.name ?? row?.category ?? row?.title ?? row?.slug ?? "").trim())
    .filter(Boolean);

  const targetSlug = categorySlug(decodeURIComponent(String(slug || "")));
  const category = categories.find((name) => categorySlug(name) === targetSlug);

  if (!category) return null;

  const { data: wallpaperRows, error: wallpaperError } = await supabase
    .from("wallpapers")
    .select("id,category,keywords,storage_path,public_url,created_at")
    .ilike("category", category)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);

  if (wallpaperError) throw wallpaperError;

  return {
    category,
    categories: [...new Set(categories)],
    items: (wallpaperRows || []).map(normalizeWallpaper),
  };
}
