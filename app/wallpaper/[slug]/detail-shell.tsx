"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Wallpaper } from "../../lib/wallpaper";
import { wallpaperImageUrl, wallpaperOriginalImageUrl, wallpaperPath, wallpaperTitle, getWallzySupabase, loadWallzyFavorites, saveWallzyFavorites } from "../../lib/wallpaper";

export default function WallpaperDetailShell({ wallpaper }: { wallpaper: Wallpaper }) {
  const router = useRouter();
  const image = wallpaperImageUrl(wallpaper) || String(wallpaper.public_url || "").trim();
  const originalImage = wallpaperOriginalImageUrl(wallpaper) || String(wallpaper.public_url || "").trim();
  const title = wallpaperTitle(wallpaper);
  const category = wallpaper.category || "Wallpaper";
  const [favorite, setFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [downloading, setDownloading] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [quality, setQuality] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [message, setMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adSlotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!originalImage) {
      setQuality("");
      return;
    }
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (cancelled) return;
      const width = probe.naturalWidth || 0;
      const height = probe.naturalHeight || 0;
      const max = Math.max(width, height);
      setQuality(
        max >= 7680 ? "8K" :
        max >= 5120 ? "6K" :
        max >= 3840 ? "4K" :
        max >= 2560 ? "2K" :
        max >= 1920 ? "FHD" :
        max >= 1280 ? "HD" : "SD"
      );
    };
    probe.onerror = () => {
      if (!cancelled) setQuality("");
    };
    probe.src = originalImage;
    return () => {
      cancelled = true;
      probe.onload = null;
      probe.onerror = null;
    };
  }, [originalImage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = getWallzySupabase();
        const { data: { user: currentUser } } = await sb.auth.getUser();
        if (cancelled) return;
        setUser(currentUser || null);
        const items = await loadWallzyFavorites(sb, currentUser || null);
        if (!cancelled) setFavorite(items.some(item => String(item?.id) === String(wallpaper.id)));
        const subscription = sb.auth.onAuthStateChange(async (_event, session) => {
          const nextUser = session?.user || null;
          setUser(nextUser);
          const nextFavorites = await loadWallzyFavorites(sb, nextUser);
          setFavorite(nextFavorites.some(item => String(item?.id) === String(wallpaper.id)));
        });
        return () => subscription.data.subscription.unsubscribe();
      } catch {}
    })();
    return () => { cancelled = true; if (timerRef.current) clearInterval(timerRef.current); };
  }, [wallpaper.id]);

  useEffect(() => {
    if (!adOpen) return;
    setSeconds(5);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(value => {
        if (value <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  }, [adOpen]);

  useEffect(() => {
    if (!adOpen || !adSlotRef.current) return;
    const iframe = document.createElement("iframe");
    iframe.title = "Advertisement";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
    iframe.style.width = "300px";
    iframe.style.height = "250px";
    iframe.style.border = "0";
    iframe.style.overflow = "hidden";
    iframe.scrolling = "no";
    iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body><script async="async" data-cfasync="false" src="https://pl31467882.profitableratecpmnetwork.com/d57e1d0e6497dfaa47e074d39d673693/invoke.js"><\/script><div id="container-d57e1d0e6497dfaa47e074d39d673693"></div></body></html>`;
    adSlotRef.current.replaceChildren(iframe);
    return () => adSlotRef.current?.replaceChildren();
  }, [adOpen]);

  const handleFavorite = async () => {
    if (!user) { setAuthOpen(true); return; }
    try {
      const sb = getWallzySupabase();
      const current = await loadWallzyFavorites(sb, user);
      const exists = current.some(item => String(item?.id) === String(wallpaper.id));
      const next = exists ? current.filter(item => String(item?.id) !== String(wallpaper.id)) : [...current, wallpaper];
      await saveWallzyFavorites(sb, user, next);
      setFavorite(!exists);
    } catch { setMessage("Unable to update favorite. Please try again."); }
  };

  const handleLogin = async () => {
    try {
      const sb = getWallzySupabase();
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
      if (error) throw error;
    } catch (error: any) { setMessage("Login failed: " + (error?.message || error)); }
  };

  const handleLogout = async () => {
    try {
      await getWallzySupabase().auth.signOut();
      setAuthOpen(false);
    } catch { setMessage("Error signing out."); }
  };

  const downloadOriginal = async () => {
    if (!originalImage) return;
    setAdOpen(false);
    setDownloading(true);
    const filename = `wallzy-${wallpaper.id}.jpg`;
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(originalImage)}&name=${encodeURIComponent(filename)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const type = blob.type || "image/jpeg";
      const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("avif") ? "avif" : "jpg";
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `wallzy-${wallpaper.id}.${extension}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      setMessage("Downloading file...");
    } catch {
      window.location.assign(`/api/download?url=${encodeURIComponent(image)}&name=${encodeURIComponent(filename)}`);
    } finally { setDownloading(false); }
  };

  const share = async () => {
    const url = window.location.origin + wallpaperPath(wallpaper);
    if (navigator.share) {
      try { await navigator.share({ title: `Wallzy — ${title}`, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setMessage("Link copied successfully!"); }
      catch { window.prompt("Share link:", url); }
    }
  };

  return (
    <main className="fixed inset-0 bg-[#000000] text-white overflow-hidden">
      {image && <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src={originalImage || image} alt="" className="absolute inset-[-12%] w-[124%] h-[124%] object-cover scale-110 blur-[55px] opacity-[0.16]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.15),#000000_72%)]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>}
      <div className="relative z-10 h-[100dvh] flex flex-col px-5 pt-5 pb-4 pointer-events-none">
        <header className="flex items-center justify-between flex-shrink-0 pt-1 relative z-20 pointer-events-auto">
          <button onClick={() => { const saved = window.sessionStorage.getItem("wallzy:return-url"); const fallback = "/"; let target = fallback; if (saved) { try { const parsed = new URL(saved, window.location.origin); if (parsed.origin === window.location.origin && !parsed.pathname.startsWith("/wallpaper/")) target = parsed.pathname + parsed.search + parsed.hash; } catch {} } window.sessionStorage.removeItem("wallzy:return-url"); router.replace(target); }} className="ripple-target w-11 h-11 rounded-full bg-white/[0.07] backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_10px_35px_rgba(0,0,0,.35)] active:scale-95 transition" aria-label="Back"><i className="fa-solid fa-arrow-left text-white text-sm" /></button>
          <span className="max-w-[64%] truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 bg-white/[0.07] backdrop-blur-xl px-4 py-2 rounded-full border border-white/15 shadow-lg">{category} • {quality || "Original"}</span>
          <button type="button" onClick={handleFavorite} className="ripple-target w-10 h-10 rounded-full bg-[#121215] border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition" aria-label="Favorite"><i className={favorite ? "fa-solid fa-heart text-white text-sm" : "fa-regular fa-heart text-white text-sm"} /></button>
        </header>

        <section className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          {!imageReady && !imageFailed && <div className="absolute inset-0 skeleton-wave" />}
          {(originalImage || image) && !imageFailed && <img src={originalImage || image} alt={title} onLoad={() => setImageReady(true)} onError={() => setImageFailed(true)} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300" decoding="async" draggable={false} />}
          <div aria-hidden="true" className="absolute inset-0 bg-black/10" />
          {imageFailed && <div className="absolute inset-0 bg-[#0a0a0c] flex items-center justify-center text-sm font-semibold text-white">Image Unavailable</div>}
        </section>

        <section className="absolute left-5 right-5 bottom-6 z-20 w-auto max-w-sm mx-auto pointer-events-auto">
          <div className="flex items-center gap-3">
            <button onClick={share} className="ripple-target flex-1 min-w-0 bg-white/[0.065] backdrop-blur-xl text-white font-semibold py-3.5 rounded-2xl border border-white/15 shadow-[0_12px_35px_rgba(0,0,0,.28)] flex items-center justify-center gap-2 active:scale-[.99] transition">
              <i className="fa-solid fa-share-nodes text-xs" />
              <span className="text-[10px] uppercase tracking-wider">Share</span>
            </button>
            <button onClick={() => setAdOpen(true)} disabled={downloading} className="ripple-target flex-1 min-w-0 bg-white hover:bg-gray-100 text-black font-semibold py-3.5 rounded-2xl shadow-[0_14px_40px_rgba(255,255,255,.12)] flex items-center justify-center gap-2 active:scale-[.99] transition disabled:opacity-60">
              <i className="fa-solid fa-download text-xs" />
              <span className="text-[10px] uppercase tracking-wider">{downloading ? "Downloading..." : `Download ${quality || "Original"}`}</span>
            </button>
          </div>
        </section>
      </div>

      {adOpen && <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1500] flex items-center justify-center p-5"><div className="relative bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl p-3 w-[326px] max-w-[92vw]"><div className="flex items-center justify-between px-1 pb-2"><span className="text-[10px] uppercase tracking-widest text-white/45">Advertisement</span><span className="text-[10px] font-semibold text-white/70">{seconds>0?seconds+"s":"Ready"}</span></div><div className="w-[300px] max-w-full h-[250px] mx-auto flex items-center justify-center overflow-hidden rounded-2xl"><div ref={adSlotRef} className="w-[300px] h-[250px] flex items-center justify-center" /></div><div className="text-center pt-3 pb-1 text-[10px] leading-4 text-white/40">Please watch the advertisement for 5 seconds to continue.</div><div className="text-center pt-2 pb-1 text-[10px] text-white/40">{seconds>0?"Please wait...":"You can continue"}</div><button onClick={downloadOriginal} disabled={seconds!==0} className={"ripple-target w-full mt-2 font-semibold py-3 rounded-2xl text-[11px] uppercase tracking-wider transition "+(seconds===0?"bg-white text-black":"bg-white/10 text-white/30")}>Download</button></div></div>}

      {downloading && <div className="fixed inset-0 z-[1600] bg-black/75 backdrop-blur-md flex items-center justify-center p-5"><div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 w-full max-w-xs text-center"><div className="download-spinner mx-auto mb-4" /><div className="text-sm font-bold text-white">Downloading</div><div className="mt-1 text-[10px] text-white/40">Getting the original image...</div></div></div>}

      {authOpen && <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[1250] flex items-center justify-center p-5"><div className="bg-[#0a0a0c] border border-white/10 p-6 rounded-3xl w-full max-w-xs shadow-2xl relative"><button onClick={()=>setAuthOpen(false)} className="ripple-target absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 text-gray-400"><i className="fa-solid fa-xmark"/></button><div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="fa-solid fa-cloud"/></div><h3 className="text-sm font-bold text-white text-center">Google Account</h3><p className="text-[11px] text-gray-400 text-center mt-1 mb-5">Sign in to sync favorites across devices.</p><button onClick={handleLogin} className="ripple-target w-full bg-white text-black font-semibold py-3 rounded-2xl text-xs"><i className="fa-brands fa-google mr-2"/>Sign in with Google</button>{message&&<p className="mt-3 text-[10px] text-white/50 text-center">{message}</p>}<button onClick={handleLogout} className={user?"ripple-target w-full mt-3 bg-white/10 text-white font-semibold py-2.5 rounded-xl text-xs":"hidden"}>Sign out</button></div></div>}

      {message && !authOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1700] flex items-center justify-center p-5"><div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-5 w-full max-w-xs text-center"><p className="text-xs text-white">{message}</p><button onClick={()=>setMessage("")} className="ripple-target mt-4 w-full bg-white text-black rounded-2xl py-2.5 text-xs font-semibold">Got it</button></div></div>}
    </main>
  );
}
