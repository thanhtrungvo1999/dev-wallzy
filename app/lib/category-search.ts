import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

const CATEGORY_CACHE = new Map<string, string | null>();
let CATEGORY_PROMISE: Promise<string[]> | null = null;

function normalizeSlug(value: string) {
  return decodeURIComponent(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function loadCategories(): Promise<string[]> {
  if (CATEGORY_PROMISE) return CATEGORY_PROMISE;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  CATEGORY_PROMISE = (async (): Promise<string[]> => {
    const { data, error } = await sb.from("categories").select("*");
    if (error) throw error;

    return (data ?? [])
      .map((row: any) =>
        String(
          row?.name ??
            row?.category ??
            row?.title ??
            row?.slug ??
            ""
        ).trim()
      )
      .filter(Boolean);
  })();

  CATEGORY_PROMISE.catch(() => {
    CATEGORY_PROMISE = null;
  });

  return CATEGORY_PROMISE;
}

export const resolveCategoryBySearch = cache(async (slug: string) => {
  const value = String(slug || "").trim().toLowerCase();
  if (!value || value === "all") return null;

  if (CATEGORY_CACHE.has(value)) return CATEGORY_CACHE.get(value) ?? null;

  const candidate = normalizeSlug(value);
  if (!candidate) return null;

  const categories = await loadCategories();
  const category = categories.find(
    (name) => normalizeSlug(name) === candidate
  ) ?? null;

  CATEGORY_CACHE.set(value, category);
  return category;
});
