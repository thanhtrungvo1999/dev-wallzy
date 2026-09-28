import { createClient } from "@supabase/supabase-js";

export type Wallpaper = {
  id: string; category: string; keywords: string[]; storage_path: string; public_url: string; created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are missing.");
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function slugifyWallpaper(value: string) {
  return String(value || "wallpaper").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "wallpaper";
}
export function wallpaperTitle(w: Wallpaper) {
  const path = String(w.storage_path || "").split("?")[0];
  const filename = decodeURIComponent(path.split("/").pop() || "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (filename) return filename.replace(/\b\w/g, c => c.toUpperCase()).slice(0, 120);
  return w.category ? `${w.category} 4K UHD Wallpaper` : "4K UHD Wallpaper";
}
export function wallpaperDescription(w: Wallpaper) {
  const category = w.category || "4K UHD";
  const keywords = (w.keywords || []).filter(Boolean).slice(0, 5).join(", ");
  return keywords ? `Download this ${category} 4K UHD wallpaper in original quality. Tags: ${keywords}.` : `Download this ${category} 4K UHD wallpaper in original quality from Wallzy.`;
}
export function wallpaperImageUrl(w: Wallpaper) {
  const path = String(w.storage_path || "").trim();
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://img.wallzy.org").replace(/\/+$/, "");
  return path ? `${base}/${path.replace(/^\/+/, "")}` : w.public_url || "";
}
export function wallpaperPath(w: Wallpaper) {
  return `/wallpaper/${slugifyWallpaper(wallpaperTitle(w))}-${encodeURIComponent(String(w.id))}`;
}
export function wallpaperIdFromSlug(slug: string) {
  const value = decodeURIComponent(String(slug || "").replace(/^\/+|\/+$/g, ""));
  const uuid = value.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuid) return uuid[1];
  const numeric = value.match(/^(\d+)(?:-|$)/);
  if (numeric) return numeric[1];
  const legacy = value.match(/-([^/]+)$/);
  return legacy ? decodeURIComponent(legacy[1]) : null;
}
export async function getWallpaperById(id: string): Promise<Wallpaper | null> {
  const sb = getSupabase();
  const { data, error } = await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? { ...data, id: String(data.id), category: String(data.category || ""), keywords: Array.isArray(data.keywords) ? data.keywords : [], storage_path: String(data.storage_path || ""), public_url: String(data.public_url || ""), created_at: String(data.created_at || "") } : null;
}
