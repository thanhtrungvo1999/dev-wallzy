import { createClient } from "@supabase/supabase-js";

const CATEGORY_CACHE_PREFIX = "wallzy:category-search:";
const CATEGORY_CACHE = new Map<string, string | null>();

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

  const cacheKey = value;
  if (CATEGORY_CACHE.has(cacheKey)) return CATEGORY_CACHE.get(cacheKey) ?? null;

  const candidate = titleFromSlug(value).trim();
  if (!candidate) return null;

  // sessionStorage survives reloads but is cleared when the browser session/tab is closed.
  if (typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(CATEGORY_CACHE_PREFIX + cacheKey);
      if (cached !== null) {
        const category = cached || null;
        CATEGORY_CACHE.set(cacheKey, category);
        return category;
      }
    } catch {}
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  const { data, error } = await sb.rpc("search_wallpapers", {
    search_query: candidate,
    search_offset: 0,
    search_limit: 1,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  const category = row?.category ? String(row.category).trim() : null;

  CATEGORY_CACHE.set(cacheKey, category);

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(CATEGORY_CACHE_PREFIX + cacheKey, category || "");
    } catch {}
  }

  return category;
}
