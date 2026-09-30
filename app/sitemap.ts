import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { wallpaperPath } from "./lib/wallpaper";

export const revalidate = 3600;

const PAGE_SIZE = 5000;
const BASE_URL = "https://www.wallzy.org";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );
}

async function getCount() {
  const { count, error } = await getSupabase()
    .from("wallpapers")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return Number(count || 0);
}

export async function generateSitemaps() {
  const count = await getCount();
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return Array.from({ length: pages }, (_, id) => ({ id }));
}

export default async function sitemap({
  id = 0,
}: {
  id?: number;
}): Promise<MetadataRoute.Sitemap> {
  const page = Math.max(0, Number(id) || 0);
  const from = page * PAGE_SIZE;

  const { data, error } = await getSupabase()
    .from("wallpapers")
    .select("id,category,keywords,storage_path,public_url,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;

  const routes: MetadataRoute.Sitemap = [];

  if (page === 0) {
    routes.push({
      url: BASE_URL + "/",
      changeFrequency: "daily",
      priority: 1,
    });
  }

  routes.push(
    ...(data || []).map((row) => ({
      url:
        BASE_URL +
        wallpaperPath({
          id: String(row.id),
          category: String(row.category || ""),
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
          storage_path: String(row.storage_path || ""),
          public_url: String(row.public_url || ""),
          created_at: String(row.created_at || ""),
        }),
      lastModified: row.created_at ? new Date(row.created_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return routes;
}
