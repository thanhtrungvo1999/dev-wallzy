import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const r2Base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.wallzy.org").replace(/\/+$/, "");
const transformBase = (process.env.NEXT_PUBLIC_IMAGE_TRANSFORM_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.wallzy.org").replace(/\/+$/, "");

function normalizeCategoryWallpaper(row: any) {
  const storagePath = String(row?.storage_path || "").trim();
  const originalUrl = storagePath
    ? (/^https?:\/\//i.test(storagePath) ? storagePath : `${r2Base}/${storagePath.replace(/^\/+/, "")}`)
    : String(row?.public_url || "").trim();

  const url = originalUrl
    ? `${transformBase}/cdn-cgi/image/width=360,quality=45,format=auto/${originalUrl}`
    : "";

  return {
    id: String(row?.id ?? ""),
    url,
    original_url: originalUrl,
    title: row?.title || row?.name || "",
    category: String(row?.category || "Other"),
    keywords: Array.isArray(row?.keywords) ? row.keywords : [],
    timestamp: String(row?.created_at || ""),
    storage_path: String(row?.storage_path || ""),
  };
}

const getCategoryData = cache(async (category: string) => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  const sb = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sb
    .from("wallpapers")
    .select("id,category,keywords,storage_path,public_url,created_at")
    .ilike("category", category)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data || []).map(normalizeCategoryWallpaper);
});

export async function getCategoryWallpapers(category: string) {
  return getCategoryData(String(category || "").trim());
}
