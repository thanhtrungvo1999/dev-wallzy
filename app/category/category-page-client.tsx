"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WallpaperGrid from "../components/WallpaperGrid";
import {
  createWallzyLoader,
  getWallzySupabase,
} from "../lib/wallpaper-client";

type CategoryWallpaper = {
  id: string;
  url: string;
  original_url: string;
  title: string;
  category: string;
  keywords: string[];
  timestamp: string;
  storage_path: string;
};

type Props = {
  category: string;
  initialItems: CategoryWallpaper[];
};

export default function CategoryPageClient({ category, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const sb = getWallzySupabase();
      const loader = createWallzyLoader(sb, category, {
        randomize: false,
        pageSize: 20,
        initialOffset: items.length,
      });
      const page = await loader();
      const nextItems = page.images || [];

      setItems(current => [...current, ...nextItems]);
      setHasMore(Boolean(nextItems.length) && Boolean(page.hasMore));
    } catch (error) {
      console.error("[Wallzy] Category load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const view = {
    mode: "explore",
    items,
    favorites: [],
    category,
    search: "",
    displayedCount: items.length,
    hasMore,
    loading: false,
    loadingMore,
  };

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <div className="mx-auto min-h-[100dvh] w-full max-w-xl px-5 pt-4 pb-10">
        <header className="sticky top-0 z-30 -mx-5 mb-5 border-b border-white/10 bg-black/90 px-5 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="ripple-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-white"
              aria-label="Back to home"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold">{category} Wallpapers</h1>
              <p className="text-[10px] text-white/40">4K UHD wallpapers for your phone</p>
            </div>
          </div>
        </header>

        <WallpaperGrid
          view={view}
          hideFavorite
          onNavigate={wallpaper => {
            router.push(`/wallpaper/${encodeURIComponent(String(wallpaper.id))}`);
          }}
          onToggleFavorite={() => {}}
          onLoadMore={loadMore}
          onExplore={() => router.push("/")}
        />
      </div>
    </main>
  );
}
