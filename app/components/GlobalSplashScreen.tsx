"use client";

import { useEffect, useState } from "react";

const MIN_SPLASH_MS = 650;

export default function GlobalSplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    const startedAt = performance.now();

    const hide = () => {
      const remaining = Math.max(0, MIN_SPLASH_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (mounted) setVisible(false);
      }, remaining);
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
    }

    return () => {
      mounted = false;
      window.removeEventListener("load", hide);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[2147483000] flex flex-col items-center justify-center overflow-hidden bg-[#08080a]">
      <div className="relative mb-7 wallzy-loader-orb">
        <div className="absolute -inset-5 rounded-[38px] border border-white/[0.035] wallzy-loader-ring" />
        <div className="absolute -inset-2.5 rounded-[32px] border border-white/[0.08]" />
        <div className="relative h-20 w-20 overflow-hidden rounded-[26px] bg-[#0a0a0c]">
          <img
            src="/icons/icon-512.svg"
            alt="Wallzy"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-[19px] font-extrabold tracking-[0.16em] text-white">
          WALLZY
        </h1>
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
