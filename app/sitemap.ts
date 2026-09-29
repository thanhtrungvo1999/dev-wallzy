import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { wallpaperPath, slugifyWallpaper } from "./lib/wallpaper";

export const revalidate = 3600;
const PAGE_SIZE = 5000;

async function getCount() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );
  const { count, error } = await sb.from("wallpapers").select("id", { count: "exact", head: true });
  if (error) throw error;
  return Number(count || 0);
}

export async function generateSitemaps() {
  const count = await getCount();
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return Array.from({ length: pages }, (_, id) => ({ id }));
}

export default async function sitemap({ id = 0 }: { id?: number }): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.wallzy.org";
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );
  const page = Math.max(0, Number(id) || 0);
  const from = page * PAGE_SIZE;

  const { data, error } = await sb
    .from("wallpapers")
    .select("id,category,storage_path,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;

  const categories = [...new Set(
    (data || [])
      .map(row => String(row.category || "").trim())
      .filter(Boolean)
  )];

  const routes: MetadataRoute.Sitemap = [];

  if (page === 0) {
    routes.push(
      { url: base + "/", changeFrequency: "daily", priority: 1 },
      { url: base + "/terms", changeFrequency: "monthly", priority: 0.2 },
      { url: base + "/privacy", changeFrequency: "monthly", priority: 0.2 },
      { url: base + "/contact", changeFrequency: "monthly", priority: 0.2 },
    );
  }

  routes.push(
    ...categories.map(category => ({
      url: base + "/category/" + slugifyWallpaper(category),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...(data || []).map(row => ({
      url: base + wallpaperPath({
        id: String(row.id),
        category: String(row.category || ""),
        keywords: [],
        storage_path: String(row.storage_path || ""),
        public_url: "",
        created_at: String(row.created_at || ""),
      }),
      lastModified: row.created_at ? String(row.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return routes;
}
