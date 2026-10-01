import { createClient } from "@supabase/supabase-js";

function titleFromSlug(slug: string) {
  return decodeURIComponent(String(slug || ""))
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function resolveCategoryBySearch(slug: string) {
  const value = String(slug || "").trim().toLowerCase();
  if (!value || value === "all") return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const candidate = titleFromSlug(value).trim();
  if (!candidate) return null;

  const { data, error } = await sb.rpc("search_wallpapers", {
    search_query: candidate,
    search_offset: 0,
    search_limit: 1,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  return row?.category ? String(row.category).trim() : null;
}
