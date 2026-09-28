import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { wallpaperPath, slugifyWallpaper } from "./lib/wallpaper";
import type { Wallpaper } from "./lib/wallpaper";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://wallzy.org";
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const wallpapers: Wallpaper[] = [];
  const categories = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await sb
      .from("wallpapers")
      .select("id,category,storage_path,created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = data || [];
    if (!rows.length) break;

    for (const row of rows) {
      const wallpaper: Wallpaper = {
        id: String(row.id),
        category: String(row.category || ""),
        keywords: [],
        storage_path: String(row.storage_path || ""),
        public_url: "",
        created_at: String(row.created_at || ""),
      };
      wallpapers.push(wallpaper);
      if (wallpaper.category) categories.add(wallpaper.category);
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base + "/", changeFrequency: "daily", priority: 1 },
    { url: base + "/explore", changeFrequency: "daily", priority: 1 },
    { url: base + "/terms", changeFrequency: "monthly", priority: 0.2 },
    { url: base + "/privacy", changeFrequency: "monthly", priority: 0.2 },
    { url: base + "/contact", changeFrequency: "monthly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = [...categories].map(category => ({
    url: base + "/category/" + slugifyWallpaper(category),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const wallpaperRoutes: MetadataRoute.Sitemap = wallpapers.map(w => ({
    url: base + wallpaperPath(w),
    lastModified: w.created_at || undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...wallpaperRoutes];
}
