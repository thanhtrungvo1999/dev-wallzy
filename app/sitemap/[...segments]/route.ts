import { createClient } from "@supabase/supabase-js";
import { wallpaperPath } from "../../lib/wallpaper";


const BASE_URL = "https://www.wallzy.org";
const PAGE_SIZE = 5000;

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getCount() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const { count, error } = await sb
    .from("wallpapers")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return Number(count || 0);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ segments: string[] }> }
) {
  const { segments } = await context.params;
  const file = segments?.[0] || "";
  const match = /^(\d+)\.xml$/.exec(file);

  if (!match) {
    return new Response("Not Found", { status: 404 });
  }

  const page = Number(match[1]);
  const count = await getCount();
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (!Number.isSafeInteger(page) || page < 0 || page >= pages) {
    return new Response("Not Found", { status: 404 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const from = page * PAGE_SIZE;
  const { data, error } = await sb
    .from("wallpapers")
    .select("id,category,keywords,storage_path,public_url,created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...(data || []).map((row) => {
      const url = BASE_URL + wallpaperPath({
        id: String(row.id),
        category: String(row.category || ""),
        keywords: Array.isArray(row.keywords) ? row.keywords : [],
        storage_path: String(row.storage_path || ""),
        public_url: String(row.public_url || ""),
        created_at: String(row.created_at || ""),
      });
      const lastmod = row.created_at
        ? `<lastmod>${xmlEscape(new Date(row.created_at).toISOString())}</lastmod>`
        : "";

      return `<url><loc>${xmlEscape(url)}</loc>${lastmod}</url>`;
    }),
    "</urlset>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
