"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getWallzySupabase,
  loadWallzyFavorites,
  saveWallzyFavorites,
} from "../lib/wallpaper-client";

const WallpaperGrid = dynamic(() => import("../components/WallpaperGrid"), { ssr: false });
const AuthModal = dynamic(() => import("../components/AuthModal"), { ssr: false });

export default function FavoritesPageClient() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [message, setMessage] = useState("");

  const accountLabel = user?.user_metadata?.full_name?.split(" ")[0] || "Account";

  const loadFavorites = async () => {
    const sb = getWallzySupabase();
    const { data: { session } } = await sb.auth.getSession();
    let currentUser = session?.user || null;

    if (!currentUser) {
      const { data: { user: verifiedUser } } = await sb.auth.getUser();
      currentUser = verifiedUser || null;
    }

    setUser(currentUser);
    if (!currentUser) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const items = await loadWallzyFavorites(sb, currentUser);
      setFavorites(items);
    } catch (error) {
      console.error("[Wallzy] Favorites page query failed:", error);
      setMessage("Unable to load your favorites.");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const sb = getWallzySupabase();

    const run = async () => {
      try {
        const { data: { session } } = await sb.auth.getSession();
        let currentUser = session?.user || null;

        if (!currentUser) {
          const { data: { user: verifiedUser } } = await sb.auth.getUser();
          currentUser = verifiedUser || null;
        }

        if (cancelled) return;
        setUser(currentUser);

        if (!currentUser) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const items = await loadWallzyFavorites(sb, currentUser);
        if (!cancelled) setFavorites(items);
      } catch (error) {
        if (!cancelled) {
          console.error("[Wallzy] Favorites page query failed:", error);
          setMessage("Unable to load your favorites.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    const subscription = sb.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const nextUser = session?.user || null;
      setUser(nextUser);

      if (!nextUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const items = await loadWallzyFavorites(sb, nextUser);
        if (!cancelled) setFavorites(items);
      } catch (error) {
        if (!cancelled) {
          console.error("[Wallzy] Favorites auth reload failed:", error);
          setMessage("Unable to load your favorites.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }).data.subscription;

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const toggleFavorite = async (id: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }

    const current = favorites;
    const exists = current.some(item => String(item?.id) === String(id));
    const next = exists
      ? current.filter(item => String(item?.id) !== String(id))
      : current;

    if (!exists) return;

    setFavorites(next);

    try {
      await saveWallzyFavorites(getWallzySupabase(), user, next);
    } catch (error) {
      console.error("[Wallzy] Favorite update failed:", error);
      setFavorites(current);
      setMessage("Unable to update favorite. Please try again.");
    }
  };

  const view = useMemo(() => ({
    mode: "favorites",
    items: favorites,
    favorites,
    displayedCount: favorites.length,
    hasMore: false,
    loading,
    loadingMore: false,
  }), [favorites, loading]);

  const handleLogin = async () => {
    try {
      const sb = getWallzySupabase();
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage("Login failed: " + (error?.message || error));
    }
  };

  const handleLogout = async () => {
    try {
      await getWallzySupabase().auth.signOut();
      setAuthOpen(false);
      setFavorites([]);
    } catch {
      setMessage("Error signing out.");
    }
  };

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-xl px-5 py-3.5 flex items-center justify-between border-b border-white/10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center"
          aria-label="Home"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold">Favorites</h1>
          {!loading && user && (
            <p className="text-[9px] text-white/35">{favorites.length} saved</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[#121215] border border-white/10 text-gray-200 text-xs font-semibold"
        >
          <i className="fa-solid fa-user-circle mr-1.5" />
          {accountLabel}
        </button>
      </header>

      <section className="h-full overflow-y-auto scrollbar-none px-5 pt-[92px] pb-28">
        <WallpaperGrid
          view={view}
          onNavigate={(wallpaper) => {
            router.push("/wallpaper/" + encodeURIComponent(String(wallpaper.id)));
          }}
          onToggleFavorite={toggleFavorite}
          onLoadMore={() => {}}
          onExplore={() => router.push("/")}
        />
      </section>

      <footer className="absolute bottom-6 inset-x-6 z-40 bg-[#0a0a0c]/90 backdrop-blur-xl border border-white/10 py-2.5 px-6 flex justify-around items-center rounded-full shadow-2xl">
        <button type="button" onClick={() => router.push("/")} className="flex flex-col items-center gap-0.5 text-gray-400">
          <i className="fa-regular fa-compass text-xs" />
          <span className="text-[9px] font-semibold">Explore</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button type="button" className="flex flex-col items-center gap-0.5 text-white">
          <i className="fa-solid fa-heart text-xs" />
          <span className="text-[9px] font-semibold">Favorites</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button type="button" onClick={() => router.push("/studio")} className="flex flex-col items-center gap-0.5 text-gray-400">
          <i className="fa-solid fa-palette text-xs" />
          <span className="text-[9px] font-semibold">Studio</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <button type="button" onClick={() => router.push("/tiktok")} className="flex flex-col items-center gap-0.5 text-gray-400">
          <i className="fa-brands fa-tiktok text-xs" />
          <span className="text-[9px] font-semibold">TikTok</span>
        </button>
      </footer>

      {authOpen && (
        <AuthModal
          user={user}
          onClose={() => setAuthOpen(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      {message && (
        <div className="fixed inset-0 z-[1700] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 w-full max-w-xs text-center">
            <p className="text-xs text-white">{message}</p>
            <button
              type="button"
              onClick={() => setMessage("")}
              className="mt-4 w-full bg-white text-black rounded-2xl py-2.5 text-xs font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
