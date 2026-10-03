import { createClient } from "@supabase/supabase-js";


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

export async function GET() {
  const count = await getCount();
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from({ length: pages }, (_, id) =>
      `<sitemap><loc>${xmlEscape(`${BASE_URL}/sitemap/${id}.xml`)}</loc></sitemap>`
    ),
    "</sitemapindex>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
