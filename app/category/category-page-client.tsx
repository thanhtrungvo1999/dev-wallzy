"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import WallpaperGrid from "../components/WallpaperGrid";
import {
  createWallzyLoader,
  getWallzySupabase,
  loadWallzyCategories,
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

const AuthModal = dynamic(() => import("../components/AuthModal"), { ssr: true });
const InstallModal = dynamic(() => import("../components/InstallModal"), { ssr: true });

type Props = {
  category: string;
  initialItems: CategoryWallpaper[];
};

function categorySlug(value: string) {
  return String(value || "all")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";
}

function WallzyAd({ size }: { size: "320x50" | "300x250" }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const delay = size === "320x50" ? 1200 : 2200;
    const run = () => {
      if (!cancelled) setReady(true);
    };

    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const timer = window.setTimeout(run, delay);
    let idleId: number | undefined;

    if (w.requestIdleCallback) {
      idleId = w.requestIdleCallback(run, { timeout: delay });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
    };
  }, [size]);

  const cfg =
    size === "320x50"
      ? {
          w: 320,
          h: 50,
          key: "2c49a0e222fe3b51d12473cd1592ca66",
          provider: "highrevenue",
        }
      : {
          w: 300,
          h: 250,
          key: "d57e1d0e6497dfaa47e074d39d673693",
          provider: "profitablerate",
        };

  const srcDoc =
    cfg.provider === "highrevenue"
      ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>atOptions={\\'key\\':\\'${cfg.key}\\',\\'format\\':\\'iframe\\',\\'height\\':${cfg.h},\\'width\\':${cfg.w},\\'params\\':{}};</script><script src="https://www.highrevenueformat.com/${cfg.key}/invoke.js"></script></body></html>`
      : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script async="async" data-cfasync="false" src="https://pl31436544.profitableratecpmnetwork.com/${cfg.key}/invoke.js"></script><div id="container-${cfg.key}"></div></body></html>`;

  return (
    <div className={size === "320x50" ? "wallzy-ad-frame-320" : "wallzy-ad-frame-300"}>
      <div className="wallzy-ad-frame-inner">
        {ready && (
          <iframe
            title="Advertisement"
            width={cfg.w}
            height={cfg.h}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
            srcDoc={srcDoc}
            style={{ width: cfg.w, height: cfg.h, border: 0, overflow: "hidden" }}
            scrolling="no"
          />
        )}
      </div>
    </div>
  );
}

function CategoryNav({
  categories,
  activeCategory,
  onSelect,
}: {
  categories: string[];
  activeCategory: string;
  onSelect: (value: string) => void;
}) {
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const active = Array.from(
      nav.querySelectorAll<HTMLElement>("[data-category]")
    ).find(
      element =>
        element.dataset.category?.toLowerCase() ===
        String(activeCategory).toLowerCase()
    );

    if (!active) return;

    const target =
      active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;

    nav.scrollTo({
      left: Math.max(0, target),
      behavior: "smooth",
    });
  }, [activeCategory, categories]);

  return (
    <nav
      ref={navRef}
      className="w-full min-w-0 px-0 py-2.5 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none"
      aria-label="Wallpaper categories"
    >
      {["all", ...categories].map(value => (
        <button
          key={value}
          data-category={value}
          type="button"
          onClick={() => onSelect(value)}
          className={
            activeCategory.toLowerCase() === value.toLowerCase()
              ? "inline-flex w-max min-w-max shrink-0 bg-white text-black shadow-sm px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              : "inline-flex w-max min-w-max shrink-0 bg-[#121215] text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          }
        >
          {value === "all" ? "#All Wallpapers" : "#" + value}
        </button>
      ))}
    </nav>
  );
}

function BottomNav() {
  const items = [
    ["explore", "fa-regular fa-compass", "Explore", "/"],
    ["favorites", "fa-regular fa-heart", "Favorites", "/favorites"],
    ["studio", "fa-solid fa-palette", "Studio", "/studio"],
    ["tiktok", "fa-brands fa-tiktok", "TikTok", "/tiktok"],
  ] as const;

  return (
    <footer
      id="footerEl"
      className="fixed bottom-12 inset-x-6 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 py-2.5 px-6 flex justify-around items-center z-40 rounded-full shadow-2xl"
    >
      {items.map(([tab, icon, label, href], index) => (
        <Fragment key={tab}>
          {index > 0 && <div className="w-[1px] h-4 bg-white/10" />}
          <button
            type="button"
            onClick={() => window.location.href = href}
            className={"flex flex-col items-center space-y-0.5 cursor-pointer transition " + (tab === "explore" ? "text-white" : "text-gray-400 hover:text-white")}
          >
            <i className={icon + " text-xs"} />
            <span className="text-[9px] font-semibold">{label}</span>
          </button>
        </Fragment>
      ))}
    </footer>
  );
}

export default function CategoryPageClient({ category, initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const [categories, setCategories] = useState<string[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [authModal, setAuthModal] = useState(false);
  const [installModal, setInstallModal] = useState(false);
  const [categoryPinned, setCategoryPinned] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setCategoryPinned(window.scrollY > 70);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const sb = getWallzySupabase();

      loadWallzyCategories(sb)
        .then((values: string[]) => {
          if (!cancelled) setCategories(values);
        })
        .catch((error: unknown) =>
          console.error("[Wallzy] Category nav load failed:", error)
        );

      sb.auth
        .getSession()
        .then(({ data }) => {
          if (!cancelled) setAuthUser(data.session?.user || null);
        })
        .catch(() => {});

      subscription = sb.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setAuthUser(session?.user || null);
      }).data.subscription;
    } catch (error) {
      console.error("[Wallzy] Category nav init failed:", error);
    }

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

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

  const selectCategory = (value: string) => {
    if (value.toLowerCase() === "all") {
      router.push("/");
      return;
    }

    router.push(`/category/${categorySlug(value)}`);
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
        <header className="-mx-5 border-b border-white/10 bg-black/95 px-5 py-3 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-xl items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="ripple-target flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-white"
              aria-label="Back to home"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold">{category} Wallpapers</h1>
              <p className="text-[10px] text-white/40">4K UHD wallpapers for your phone</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => setInstallModal(true)} className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center text-gray-200 hover:bg-[#222228] transition cursor-pointer" title="Install" aria-label="Install">
                <i className="fa-solid fa-mobile-screen-button text-xs text-white" />
              </button>
              <button type="button" onClick={() => setAuthModal(true)} className="px-3 py-1.5 rounded-full bg-[#121215] hover:bg-[#222228] text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10" title="Account" aria-label="Account">
                <i className="fa-solid fa-user-circle text-xs text-white" />
                <span>{authUser?.user_metadata?.full_name?.split(" ")[0] || "Account"}</span>
              </button>
            </div>
          </div>
        </header>

        <div className="h-[54px] -mx-5">
          <div
            className={
              categoryPinned
                ? "fixed top-0 left-0 right-0 z-50 bg-black/95 px-5 backdrop-blur-xl border-b border-white/10"
                : "bg-black/95 px-5 backdrop-blur-xl border-b border-white/10"
            }
          >
            <div className="mx-auto w-full max-w-xl">
              <CategoryNav
                categories={categories}
                activeCategory={category}
                onSelect={selectCategory}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-center pt-2 mb-2">
            <WallzyAd size="320x50" />
          </div>

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

          <div className="flex justify-center pt-6">
            <WallzyAd size="300x250" />
          </div>
        </div>

        <BottomNav />
      </div>
      {installModal && <InstallModal onClose={() => setInstallModal(false)} />}
      {authModal && <AuthModal user={authUser} onClose={() => setAuthModal(false)} onLogin={async () => {
        const sb = getWallzySupabase();
        const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
        if (error) console.error("[Wallzy] Login failed:", error);
      }} onLogout={async () => {
        const sb = getWallzySupabase();
        const { error } = await sb.auth.signOut();
        if (!error) setAuthModal(false);
      }} />}
    </main> );
}
