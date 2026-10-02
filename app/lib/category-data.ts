import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { normalizeWallzyWallpaper } from "./wallpaper-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const getCategoryData = cache(async (category: string) => {
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are missing.");

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

  return (data || []).map(normalizeWallzyWallpaper);
});

export async function getCategoryWallpapers(category: string) {
  return getCategoryData(String(category || "").trim());
}
