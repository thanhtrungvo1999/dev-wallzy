"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Wallpaper } from "../../lib/wallpaper";
import { wallpaperImageUrl, wallpaperPath, wallpaperTitle } from "../../lib/wallpaper";

declare global {
  interface Window {
    __wallzyIsFavorite?: (id: string) => boolean;
    __wallzyToggleDetailFavorite?: (wallpaper: Wallpaper) => Promise<boolean | null>;
  }
}

export default function WallpaperDetailShell({ wallpaper }: { wallpaper: Wallpaper }) {
  const router = useRouter();
  const image = wallpaperImageUrl(wallpaper);
  const title = wallpaperTitle(wallpaper);
  const category = wallpaper.category || "Wallpaper";
  const [favorite, setFavorite] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const [downloading, setDownloading] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageSrc, setImageSrc] = useState(image);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const syncFavorite = () => {
      if (cancelled) return;
      const getter = window.__wallzyIsFavorite;
      if (typeof getter === "function") {
        setFavorite(Boolean(getter(wallpaper.id)));
        return;
      }
      if (attempts++ < 30) window.setTimeout(syncFavorite, 100);
    };
    syncFavorite();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [wallpaper.id]);

  useEffect(() => {
    if (!adOpen) return;

    // Inject the ad only after the modal is open. Keeping third-party
    // ad markup out of the initial server HTML avoids hydration problems
    // on the standalone detail route.
    const slot = document.getElementById("detailAdSlot");
    if (slot) {
      slot.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.title = "Advertisement";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
      iframe.style.width = "300px";
      iframe.style.height = "250px";
      iframe.style.border = "0";
      iframe.style.overflow = "hidden";
      iframe.scrolling = "no";
      iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body><script async="async" data-cfasync="false" src="https://pl31467882.profitableratecpmnetwork.com/d57e1d0e6497dfaa47e074d39d673693/invoke.js"></script><div id="container-d57e1d0e6497dfaa47e074d39d673693"></div></body></html>`;
      slot.appendChild(iframe);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(5);
    timerRef.current = setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [adOpen]);

  const handleFavorite = async () => {
    const toggle = window.__wallzyToggleDetailFavorite;
    if (typeof toggle !== "function") return;
    const result = await toggle(wallpaper);
    if (result !== null) setFavorite(result);
  };

  const downloadOriginal = async () => {
    if (!image) return;
    setAdOpen(false);
    setDownloading(true);
    const filename = `wallzy-${wallpaper.id}.jpg`;
    try {
      const response = await fetch(image, {
        mode: "cors",
        credentials: "omit",
        cache: "force-cache",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error("Empty image");
      const type = blob.type || "image/jpeg";
      const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("avif") ? "avif" : "jpg";
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `wallzy-${wallpaper.id}.${extension}`;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (error) {
      console.warn("[Wallzy] Direct detail download failed:", error);
      const fallbackUrl = `/api/download?url=${encodeURIComponent(image)}&name=${encodeURIComponent(filename)}`;
      const link = document.createElement("a");
      link.href = fallbackUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  const startDownload = () => {
    setSeconds(5);
    setAdOpen(true);
  };

  const share = async () => {
    const url = window.location.origin + wallpaperPath(wallpaper);
    if (navigator.share) {
      try { await navigator.share({ title: `Wallzy — ${title}`, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        window.alert("Link copied successfully!");
      } catch {
        window.prompt("Share link:", url);
      }
    }
  };

  return (
    <main className="fixed inset-0 bg-[#000000] text-white overflow-hidden">
      <div className="h-[100dvh] flex flex-col p-5">
        <header className="flex items-center justify-between flex-shrink-0 pt-1">
          <button onClick={() => router.back()} className="relative z-50 pointer-events-auto touch-manipulation w-10 h-10 rounded-full bg-[#121215] border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition" aria-label="Back">
            <i className="fa-solid fa-arrow-left text-white text-sm" />
          </button>
          <span className="max-w-[62%] truncate text-[10px] font-semibold uppercase tracking-widest text-white/90 bg-[#121215]/80 px-3.5 py-1.5 rounded-full border border-white/20">
            {category} • 4K
          </span>
          <button id="detailFavoriteButton" type="button" onClick={handleFavorite} className="w-10 h-10 rounded-full bg-[#121215] border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition" aria-label="Favorite">
            <i className={favorite ? "fa-solid fa-heart text-white text-sm" : "fa-regular fa-heart text-white text-sm"} />
          </button>
        </header>

        <section className="flex-1 min-h-0 flex items-center justify-center py-5">
          <div className="relative h-full max-h-full max-w-full flex items-center justify-center">
            {!imageReady && !imageFailed && <div className="absolute inset-0 rounded-2xl skeleton-wave" />}
            <img
              src={imageSrc}
              alt={title}
              onLoad={() => setImageReady(true)}
              onError={() => {
                if (imageSrc !== wallpaper.public_url && wallpaper.public_url) {
                  setImageSrc(wallpaper.public_url);
                  setImageFailed(false);
                  return;
                }
                setImageFailed(true);
              }}
              className={`relative z-10 max-h-full max-w-full object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${imageReady ? "opacity-100" : "opacity-100"}`}
              decoding="async"
              draggable={false}
            />
            {imageFailed && <div className="absolute inset-0 rounded-2xl bg-[#0a0a0c] flex items-center justify-center text-sm font-semibold text-white">Image Unavailable</div>}
          </div>
        </section>

        <section className="flex-shrink-0 w-full max-w-sm mx-auto space-y-2.5 pb-1">
          <button onClick={share} className="w-full bg-[#121215] text-white font-semibold py-3 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center gap-2 active:scale-[.99] transition">
            <i className="fa-solid fa-share-nodes text-xs" />
            <span className="text-[11px] uppercase tracking-wider">Share Wallpaper</span>
          </button>
          <button onClick={startDownload} disabled={downloading} className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-[.99] transition disabled:opacity-60">
            <i className="fa-solid fa-download text-xs" />
            <span className="text-[11px] uppercase tracking-wider">{downloading ? "Downloading..." : "Download 4K UHD"}</span>
          </button>
        </section>
      </div>

      {adOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1500] flex items-center justify-center p-5">
          <div className="relative bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl p-3 w-[326px] max-w-[92vw]">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-[10px] uppercase tracking-widest text-white/45">Advertisement</span>
              <span className="text-[10px] font-semibold text-white/70">{seconds > 0 ? `${seconds}s` : "Ready"}</span>
            </div>
            <div className="w-[300px] max-w-full h-[250px] mx-auto flex items-center justify-center overflow-hidden rounded-2xl">
              <div id="detailAdSlot" className="w-[300px] h-[250px] flex items-center justify-center" />
            </div>
            <div className="text-center pt-3 pb-1 text-[10px] leading-4 text-white/40">Please watch the advertisement for 5 seconds to continue.</div>
            <div className="text-center pt-2 pb-1 text-[10px] text-white/40">{seconds > 0 ? "Please wait..." : "You can continue"}</div>
            <button onClick={downloadOriginal} disabled={seconds !== 0} className={`w-full mt-2 font-semibold py-3 rounded-2xl text-[11px] uppercase tracking-wider transition ${seconds === 0 ? "bg-white text-black cursor-pointer" : "bg-white/10 text-white/30 cursor-not-allowed"}`}>
              Download
            </button>
          </div>
        </div>
      )}

      {downloading && (
        <div className="fixed inset-0 z-[1600] bg-black/75 backdrop-blur-md flex items-center justify-center p-5">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl p-6 w-full max-w-xs text-center">
            <div className="download-spinner mx-auto mb-4" />
            <div className="text-sm font-bold text-white">Downloading</div>
            <div className="mt-1 text-[10px] text-white/40">Getting the original image...</div>
          </div>
        </div>
      )}

      <div id="authModal" className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[1250] hidden flex flex-col items-center justify-center p-5 animate-fade-in" style={{ height: "100dvh", minHeight: "100dvh" }}>
        <div className="bg-[#0a0a0c] border border-white/10 p-6 rounded-3xl w-full max-w-xs h-[290px] max-h-[calc(100dvh-32px)] overflow-hidden text-center space-y-5 shadow-2xl relative" style={{ flex: "0 0 290px" }}>
          <button onClick={() => (window as any).closeAuthModal?.()} className="absolute top-4 right-4 left-auto text-gray-400 hover:text-white text-xs w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition cursor-pointer" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mx-auto text-xl shadow-lg">
            <i className="fa-solid fa-cloud text-black" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Google Account</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">Sign in to sync your favorite wallpapers across devices.</p>
          </div>
          <div id="loggedOutView" className="space-y-2.5 pt-1">
            <button id="googleLoginBtn" onClick={() => (window as any).loginWithGoogleReal?.()} className="w-full bg-white hover:bg-gray-200 text-black font-semibold py-3 px-4 rounded-2xl shadow-md transition flex items-center justify-center space-x-2.5 text-xs cursor-pointer">
              <i id="googleIcon" className="fa-brands fa-google text-sm text-black" />
              <span id="googleLoginText">Sign in with Google</span>
            </button>
          </div>
          <div id="loggedInView" className="space-y-3 pt-2 hidden">
            <div className="flex items-center space-x-3 bg-[#000000] p-3 rounded-2xl border border-white/10 text-left">
              <img id="userAvatar" src="" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="overflow-hidden">
                <div id="userName" className="text-xs font-bold text-white truncate">User Name</div>
                <div id="userEmail" className="text-[10px] text-gray-400 truncate">email@domain.com</div>
              </div>
            </div>
            <div id="userIdDisplay" className="text-[9px] text-gray-300 font-mono text-left truncate px-1">UID: ...</div>
            <button onClick={() => (window as any).logoutUser?.()} className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 rounded-xl transition text-xs cursor-pointer border border-white/20">
              <i className="fa-solid fa-right-from-bracket mr-1.5 text-white" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
