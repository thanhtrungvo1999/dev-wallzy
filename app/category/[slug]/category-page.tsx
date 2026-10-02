"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createWallzyLoader,
  getWallzySupabase,
  loadWallzyFavorites,
  saveWallzyFavorites,
} from "../../lib/wallpaper-client";

const WallpaperGrid = dynamic(() => import("../../components/WallpaperGrid"), { ssr: true });
const AuthModal = dynamic(() => import("../../components/AuthModal"), { ssr: true });
const InstallModal = dynamic(() => import("../../components/InstallModal"), { ssr: true });

function categorySlug(value: string) {
  return String(value || "all")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";
}

function CategoryNav({ categories, activeCategory }: { categories: string[]; activeCategory: string }) {
  const router = useRouter();
  const navRef = useRef<HTMLElement | null>(null);
  const all = ["all", ...categories];

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const active = Array.from(nav.querySelectorAll<HTMLElement>(".cat-btn")).find(
      (el) => el.dataset.category?.toLowerCase() === activeCategory.toLowerCase()
    );
    if (!active) return;
    const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeCategory]);

  return (
    <nav
      ref={navRef}
      className="w-full min-w-0 px-5 py-2.5 flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-none"
      aria-label="Wallpaper categories"
    >
      {all.map((value) => (
        <button
          key={value}
          type="button"
          data-category={value}
          onClick={() => router.push(value === "all" ? "/" : `/category/${categorySlug(value)}`)}
          className={
            activeCategory.toLowerCase() === value.toLowerCase()
              ? "cat-btn inline-flex w-max min-w-max shrink-0 bg-white text-black shadow-sm px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              : "cat-btn inline-flex w-max min-w-max shrink-0 bg-[#121215] text-gray-400 hover:text-white border border-white/10 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
          }
        >
          {value === "all" ? "#All Wallpapers" : "#" + value}
        </button>
      ))}
    </nav>
  );
}

function Header({ onInstall, onAuth, user }: { onInstall: () => void; onAuth: () => void; user: any }) {
  const accountLabel = user?.user_metadata?.full_name?.split(" ")[0] || "Account";
  return (
    <header className="absolute top-0 left-0 right-0 z-40 bg-[#000000]/90 backdrop-blur-xl px-5 py-3.5 flex justify-between items-center border-b border-white/10">
      <span className="font-bold text-lg tracking-tight text-white">Wallzy DB.</span>
      <div className="flex items-center space-x-2">
        <button type="button" onClick={onInstall} className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center text-gray-200" title="Install">
          <i className="fa-solid fa-mobile-screen-button text-xs text-white" />
        </button>
        <button type="button" onClick={onAuth} className="px-3 py-1.5 rounded-full bg-[#121215] text-gray-200 text-xs font-semibold flex items-center space-x-1.5 border border-white/10" title="Account">
          <i className="fa-solid fa-user-circle text-xs text-white" />
          <span>{accountLabel}</span>
        </button>
      </div>
    </header>
  );
}

function BottomNav({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const items = [
    ["explore", "fa-regular fa-compass", "Explore"],
    ["favorites", "fa-regular fa-heart", "Favorites"],
    ["studio", "fa-solid fa-palette", "Studio"],
    ["tiktok", "fa-brands fa-tiktok", "TikTok"],
  ] as const;

  return (
    <footer className="absolute bottom-12 inset-x-6 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 py-2.5 px-6 flex justify-around items-center z-30 rounded-full shadow-2xl">
      {items.map(([tab, icon, label], index) => (
        <div key={tab} className="contents">
          {index > 0 && <div className="w-[1px] h-4 bg-white/10" />}
          <button
            type="button"
            onClick={() => onNavigate(tab)}
            className="flex flex-col items-center space-y-0.5 cursor-pointer text-gray-400 hover:text-white transition"
          >
            <i className={icon + " text-xs"} />
            <span className="text-[9px] font-semibold">{label}</span>
          </button>
        </div>
      ))}
    </footer>
  );
}

function AdBanner({ size }: { size: "320x50" | "300x250" }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const delay = size === "320x50" ? 1200 : 2200;
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [size]);

  const cfg =
    size === "320x50"
      ? { w: 320, h: 50, key: "2c49a0e222fe3b51d12473cd1592ca66" }
      : { w: 300, h: 250, key: "d57e1d0e6497dfaa47e074d39d673693" };

  const srcDoc =
    size === "320x50"
      ? `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body><script>atOptions={'key':'${cfg.key}','format':'iframe','height':50,'width':320,'params':{}};</script><script src="https://www.highrevenueformat.com/${cfg.key}/invoke.js"></script></body></html>`
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

export default function CategoryPageClient({
  category,
  categories,
  initialItems,
}: {
  category: string;
  categories: string[];
  initialItems: any[];
}) {
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);
  const sbRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState({
    mode: "explore",
    items: initialItems,
    favorites: [] as any[],
    category,
    search: "",
    displayedCount: initialItems.length,
    hasMore: initialItems.length === 20,
    loading: false,
    loadingMore: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = getWallzySupabase();
        sbRef.current = sb;
        const { data: { session } } = await sb.auth.getSession();
        const nextUser = session?.user || null;
        if (cancelled) return;
        userRef.current = nextUser;
        setUser(nextUser);
        const favs = await loadWallzyFavorites(sb, nextUser);
        if (!cancelled) setFavorites(favs);
      } catch (error) {
        console.error("[Wallzy] Category bootstrap failed:", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!sbRef.current) return;
    const subscription = sbRef.current.auth.onAuthStateChange((_event: any, session: any) => {
      const nextUser = session?.user || null;
      userRef.current = nextUser;
      setUser(nextUser);
      void loadWallzyFavorites(sbRef.current, nextUser).then(setFavorites).catch(console.error);
    });
    return () => subscription.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setView((v) => ({ ...v, favorites }));
  }, [favorites]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const id = String(detail.id || "");
      if (!id) return;
      setFavorites((current) => {
        if (detail.favorite) {
          const item = detail.wallpaper;
          if (!item || current.some((x) => String(x?.id) === id)) return current;
          return [...current, item];
        }
        return current.filter((x) => String(x?.id) !== id);
      });
    };
    window.addEventListener("wallzy:favorite-updated", handler);
    return () => window.removeEventListener("wallzy:favorite-updated", handler);
  }, []);

  const navigateWallpaper = (wallpaper: any) => {
    if (!wallpaper?.id) return;
    router.push(`/wallpaper/${wallpaper.id}`);
  };

  const toggleFavorite = async (id: string) => {
    const currentUser = userRef.current;
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    const wallpaper = view.items.find((item: any) => String(item.id) === String(id));
    if (!wallpaper) return;
    const exists = favorites.some((item) => String(item.id) === String(id));
    const next = exists
      ? favorites.filter((item) => String(item.id) !== String(id))
      : [...favorites, wallpaper];
    setFavorites(next);
    try {
      await saveWallzyFavorites(sbRef.current, currentUser, next);
    } catch (error) {
      console.error("[Wallzy] Favorite update failed:", error);
      setFavorites(favorites);
      setMessage("Unable to update favorite. Please try again.");
    }
  };

  const loadMore = async () => {
    if (view.loadingMore || !view.hasMore || !sbRef.current) return;
    setView((v) => ({ ...v, loadingMore: true }));
    try {
      const loader = createWallzyLoader(sbRef.current, category, {
        randomize: false,
        initialOffset: view.items.length,
      });
      const page = await loader();
      const nextItems = [...view.items, ...(page.images || [])];
      setView((v) => ({
        ...v,
        items: nextItems,
        displayedCount: nextItems.length,
        hasMore: Boolean(page.hasMore),
        loadingMore: false,
      }));
    } catch (error) {
      console.error("[Wallzy] Category load more failed:", error);
      setMessage("Unable to load more wallpapers. Please try again.");
      setView((v) => ({ ...v, loadingMore: false }));
    }
  };

  const login = async () => {
    try {
      const { error } = await sbRef.current.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage("Login failed: " + (error?.message || error));
    }
  };

  const logout = async () => {
    try {
      const { error } = await sbRef.current.auth.signOut();
      if (error) throw error;
      setAuthOpen(false);
    } catch {
      setMessage("Error signing out.");
    }
  };

  const navigateTab = (tab: string) => {
    router.push(tab === "explore" ? "/" : "/" + tab);
  };

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let last = 0;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const current = el.scrollTop;
        if (current > 6 && current > last) {
          document.getElementById("categoryHeader")?.classList.add("-translate-y-full");
        } else if (current <= 6 || current < last) {
          document.getElementById("categoryHeader")?.classList.remove("-translate-y-full");
        }
        last = current;
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#08080a] text-white">
      <main ref={mainRef} className="relative w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth pb-36">
        <div id="categoryHeader" className="sticky top-0 z-40 transition-transform duration-300 bg-[#08080a]">
          <Header onInstall={() => setInstallOpen(true)} onAuth={() => setAuthOpen(true)} user={user} />
          <div className="pt-[59px]">
            <button type="button" onClick={() => router.push("/search")} className="w-full px-5 pt-3 pb-1 text-left">
              <div className="relative flex items-center">
                <i className="fa-solid fa-magnifying-glass absolute left-8 text-gray-400 text-xs pointer-events-none" />
                <div className="w-full bg-[#0a0a0c] border border-white/10 rounded-2xl py-2.5 pl-10 pr-9 text-[16px] sm:text-xs text-white/80">
                  Search keywords, categories, tags...
                </div>
              </div>
            </button>
            <CategoryNav categories={categories} activeCategory={category} />
          </div>
        </div>

        <section className="px-5 pt-4">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/35 mb-1">Category</div>
              <h1 className="text-xl font-extrabold tracking-tight">{category} Wallpapers</h1>
            </div>
            <span className="text-[10px] text-white/30 whitespace-nowrap">Latest</span>
          </div>

          <WallpaperGrid
            view={view}
            onNavigate={navigateWallpaper}
            onToggleFavorite={toggleFavorite}
            onLoadMore={loadMore}
            onExplore={() => router.push("/")}
          />

          <div className="pt-5 pb-2">
            <AdBanner size="300x250" />
          </div>
        </section>

        <div className="pt-3 pb-8">
          <AdBanner size="320x50" />
        </div>

        <BottomNav onNavigate={navigateTab} />
      </main>

      {message && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[1200] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0c] border border-white/10 p-6 rounded-3xl max-w-xs w-full text-center space-y-4">
            <p className="text-xs text-gray-200 font-medium">{message}</p>
            <button type="button" onClick={() => setMessage(null)} className="w-full bg-white text-black font-semibold py-2.5 rounded-xl text-xs">
              Got it
            </button>
          </div>
        </div>
      )}

      {authOpen && (
        <AuthModal
          user={user}
          onClose={() => setAuthOpen(false)}
          onLogin={login}
          onLogout={logout}
        />
      )}
      {installOpen && <InstallModal onClose={() => setInstallOpen(false)} />}
    </div>
  );
}
