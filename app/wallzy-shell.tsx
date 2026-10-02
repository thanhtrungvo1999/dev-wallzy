"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BottomNav from "./components/BottomNav";

const HomeCategorySections = dynamic(() => import("./components/HomeCategorySections"), {
  ssr: false,
});

const AuthModal = dynamic(() => import("./components/AuthModal"), {
  ssr: false,
});

const InstallModal = dynamic(() => import("./components/InstallModal"), {
  ssr: false,
});

const OfflineWarning = () => {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex h-full w-full flex-col items-center justify-center bg-black p-8 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-[#121215] shadow-2xl">
        <i className="fa-solid fa-wifi animate-pulse text-3xl text-red-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[2px] w-12 rotate-45 bg-red-500" />
        </div>
      </div>
      <h2 className="mb-2 text-xl font-extrabold tracking-tight text-white">
        No Internet Connection
      </h2>
      <p className="mb-6 max-w-[280px] text-xs leading-relaxed text-gray-400">
        Your device is currently offline. Please check your Wi-Fi or mobile data connection.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-2xl bg-white px-6 py-3 text-xs font-semibold text-black shadow-lg transition active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
};

function LandscapeWarning() {
  return (
    <div className="wallzy-landscape-warning fixed inset-0 z-[9999] hidden flex-col items-center justify-center bg-black p-8 text-center">
      <div className="relative mb-6">
        <i className="fa-solid fa-mobile-screen text-6xl text-white" />
        <i className="fa-solid fa-rotate-right absolute -bottom-2 -right-4 animate-spin-slow text-2xl text-gray-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-white">Rotate Your Device</h2>
      <p className="max-w-[300px] text-sm text-gray-400">
        The app is optimized for portrait mode. Please rotate your device to continue.
      </p>
    </div>
  );
}

function SplashScreen({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden bg-[#08080a]">
      <div className="relative mb-7 wallzy-loader-orb">
        <div className="absolute -inset-5 rounded-[38px] border border-white/[0.035] wallzy-loader-ring" />
        <div className="absolute -inset-2.5 rounded-[32px] border border-white/[0.08]" />
        <div className="relative h-20 w-20 overflow-hidden rounded-[26px] bg-[#0a0a0c]">
          <img src="/icons/icon-512.svg" alt="Wallzy" className="h-full w-full object-cover" draggable={false} />
        </div>
      </div>
      <div className="relative z-10 text-center">
        <h1 className="text-[19px] font-extrabold tracking-[0.16em] text-white">WALLZY</h1>
        <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/35">
          Wallpaper Studio
        </p>
      </div>
      <div className="mt-9 w-28">
        <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full w-1/2 rounded-full bg-white/80 animate-[wallzyLoadingBar_1.35s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

function Header({
  onInstall,
  onAuth,
  user,
}: {
  onInstall: () => void;
  onAuth: () => void;
  user: any;
}) {
  const accountLabel = user?.user_metadata?.full_name?.split(" ")[0] || "Account";

  return (
    <header className="absolute left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/90 px-5 py-3.5 backdrop-blur-xl">
      <span className="text-lg font-bold tracking-tight text-white">Wallzy DB.</span>
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={onInstall}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#121215] text-gray-200 transition hover:bg-[#222228]"
          title="Install"
        >
          <i className="fa-solid fa-mobile-screen-button text-xs text-white" />
        </button>
        <button
          type="button"
          onClick={onAuth}
          className="flex items-center space-x-1.5 rounded-full border border-white/10 bg-[#121215] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-[#222228]"
          title="Account"
        >
          <i className="fa-solid fa-user-circle text-xs text-white" />
          <span>{accountLabel}</span>
        </button>
      </div>
    </header>
  );
}

function WallzyAd({size}:{size:"320x50"|"300x250"}) {
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const t=window.setTimeout(()=>setReady(true),size==="320x50"?1200:2200);
    return()=>window.clearTimeout(t);
  },[size]);

  const cfg=size==="320x50"
    ? {w:320,h:50,key:"2c49a0e222fe3b51d12473cd1592ca66",provider:"highrevenue"}
    : {w:300,h:250,key:"d57e1d0e6497dfaa47e074d39d673693",provider:"profitablerate"};

  const srcDoc=cfg.provider==="highrevenue"
    ? `<!DOCTYPE html><html><body style="margin:0;overflow:hidden"><script>atOptions={'key':'${cfg.key}','format':'iframe','height':${cfg.h},'width':${cfg.w},'params':{}};</script><script src="https://www.highrevenueformat.com/${cfg.key}/invoke.js"></script></body></html>`
    : `<!DOCTYPE html><html><body style="margin:0;overflow:hidden"><script async="async" data-cfasync="false" src="https://pl31436544.profitableratecpmnetwork.com/${cfg.key}/invoke.js"></script><div id="container-${cfg.key}"></div></body></html>`;

  return <div className={size==="320x50"?"wallzy-ad-frame-320":"wallzy-ad-frame-300"}>
    <div className="wallzy-ad-frame-inner">
      {ready&&<iframe title="Advertisement" width={cfg.w} height={cfg.h} loading="lazy" sandbox="allow-scripts allow-same-origin allow-popups" srcDoc={srcDoc} style={{width:cfg.w,height:cfg.h,border:0}} scrolling="no"/>}
    </div>
  </div>;
}

function SearchBar() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => { window.dispatchEvent(new Event("wallzy:navigation-start")); router.push("/search"); }}
      className="w-full px-5 pb-1 pt-3 text-left"
    >
      <div className="relative flex items-center">
        <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 text-xs text-gray-400" />
        <div className="w-full rounded-2xl border border-white/10 bg-[#0a0a0c] py-2.5 pl-10 pr-9 text-[16px] text-white/80 shadow-inner sm:text-xs">
          Search keywords, categories, tags...
        </div>
      </div>
    </button>
  );
}

export default function WallzyShell() {
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);
  const sbRef = useRef<any>(null);
  const userRef = useRef<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [installModal, setInstallModal] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const client = await import("./lib/wallpaper-client");
        const sb = client.getWallzySupabase();
        sbRef.current = sb;

        const [{ data: sessionData }, categoryData] = await Promise.all([
          sb.auth.getSession(),
          client.loadWallzyCategories(sb),
        ]);

        if (cancelled) return;

        const currentUser = sessionData.session?.user || null;
        userRef.current = currentUser;
        setUser(currentUser);
        setCategories(categoryData);

        const favs = await client.loadWallzyFavorites(sb, currentUser);
        if (!cancelled) setFavorites(favs);
      } catch (error) {
        console.error("[Wallzy] Home bootstrap failed:", error);
      } finally {
        if (!cancelled) setSplashHidden(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sbRef.current) return;

    const subscription = sbRef.current.auth.onAuthStateChange(
      (_event: string, session: any) => {
        const nextUser = session?.user || null;
        userRef.current = nextUser;
        setUser(nextUser);

        void import("./lib/wallpaper-client")
          .then((client) => client.loadWallzyFavorites(sbRef.current, nextUser))
          .then(setFavorites)
          .catch((error) => console.error("[Wallzy] Favorite reload failed:", error));
      },
    );

    return () => subscription.data.subscription.unsubscribe();
  }, []);

  const toggleFavorite = async (id: string) => {
    const currentUser = userRef.current;

    if (!currentUser) {
      setAuthModal(true);
      return;
    }

    const wallpaper = favorites.find((item) => String(item?.id) === String(id));
    if (!wallpaper) return;

    const current = [...favorites];
    const exists = current.some((item) => String(item?.id) === String(id));
    if (!exists) return;

    try {
      const client = await import("./lib/wallpaper-client");
      const next = current.filter((item) => String(item?.id) !== String(id));
      setFavorites(next);
      await client.saveWallzyFavorites(sbRef.current, currentUser, next);
    } catch (error) {
      setFavorites(current);
      console.error("[Wallzy] Favorite update failed:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const { error } = await sbRef.current.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    } catch (error) {
      console.error("[Wallzy] Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await sbRef.current.auth.signOut();
      setAuthModal(false);
    } catch (error) {
      console.error("[Wallzy] Logout failed:", error);
    }
  };

  const openWallpaper = (wallpaper: any) => {
    try {
      window.sessionStorage.setItem("wallzy:return-url", window.location.href);
      window.sessionStorage.setItem("wallzy:return-scroll", String(mainRef.current?.scrollTop || 0));
    } catch {}

    window.dispatchEvent(new Event("wallzy:navigation-start"));
      router.push("/wallpaper/" + encodeURIComponent(String(wallpaper.id)));
  };

  const openCategory = (category: string) => {
    window.dispatchEvent(new Event("wallzy:navigation-start"));
      router.push("/category/" + String(category || "all").trim().toLowerCase().replace(/\s+/g, "-"));
  };

  return (
    <>
      <SplashScreen visible={!splashHidden} />
      <LandscapeWarning />

      <div className="relative flex h-[100dvh] w-full min-w-0 max-w-none flex-col overflow-hidden bg-black shadow-2xl">
        <Header
          onInstall={() => setInstallModal(true)}
          onAuth={() => setAuthModal(true)}
          user={user}
        />

        <div className="absolute left-0 right-0 top-[56px] z-[35] bg-black/90 backdrop-blur-xl">
          <SearchBar />
        </div>

        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto bg-transparent px-5 pb-28 pt-[120px] scrollbar-none"
        >
          <WallzyAd size="320x50" />
          <HomeCategorySections
            categories={categories}
            favorites={favorites}
            sb={sbRef.current}
            onNavigate={openWallpaper}
            onToggleFavorite={toggleFavorite}
            onViewAll={openCategory}
          />
        </main>

        <BottomNav active="explore" />
      </div>

      {installModal && <InstallModal onClose={() => setInstallModal(false)} />}
      {authModal && (
        <AuthModal
          user={user}
          onClose={() => setAuthModal(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      <OfflineWarning />
    </>
  );
}
