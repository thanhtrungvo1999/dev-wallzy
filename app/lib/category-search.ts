import { cache } from "react";
import { createClient } from "@supabase/supabase-js";

const CATEGORY_CACHE = new Map<string, string | null>();
let CATEGORY_PROMISE: Promise<string[]> | null = null;

function titleFromSlug(slug: string) {
  return decodeURIComponent(String(slug || ""))
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadCategories() {
  if (CATEGORY_PROMISE) return CATEGORY_PROMISE;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""
  );

  CATEGORY_PROMISE = sb
    .from("categories")
    .select("*")
    .then(({ data, error }) => {
      if (error) throw error;
      return (data || [])
        .map((row: any) => String(row?.name ?? row?.category ?? row?.title ?? row?.slug ?? "").trim())
        .filter(Boolean);
    })
    .catch(error => {
      CATEGORY_PROMISE = null;
      throw error;
    });

  return CATEGORY_PROMISE;
}

export const resolveCategoryBySearch = cache(async (slug: string) => {
  const value = String(slug || "").trim().toLowerCase();
  if (!value || value === "all") return null;

  if (CATEGORY_CACHE.has(value)) return CATEGORY_CACHE.get(value) ?? null;

  const candidate = titleFromSlug(value).trim().toLowerCase();
  if (!candidate) return null;

  const categories = await loadCategories();
  const category = categories.find(name => name.toLowerCase() === candidate) ?? null;

  CATEGORY_CACHE.set(value, category);
  return category;
});
