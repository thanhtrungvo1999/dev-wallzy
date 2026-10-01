"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WallzyShell = dynamic(() => import("./wallzy-shell"), {\n  ssr: false,\n  loading: () => (\n    <div className="min-h-screen bg-[#08080a] flex items-center justify-center">\n      <div className="w-20 h-20 rounded-[26px] bg-[#0a0a0c] border border-white/10 flex items-center justify-center shadow-2xl">\n        <img src="/icons/icon-192.svg" alt="Wallzy" className="w-full h-full rounded-[25px]" draggable={false} />\n      </div>\n    </div>\n  ),\n});

export default function WallzyShellClient() {
  const pathname = usePathname() || "/";
  const isWallpaperDetail = pathname.startsWith("/wallpaper/");
  const isCategory = pathname.startsWith("/category/");
  const isSearch = pathname === "/search";
  const isKnownShellRoute =
    pathname === "/" ||
    pathname === "/studio" ||
    pathname === "/tiktok" ||
    pathname === "/favorites" ||
    isCategory;

  // Detail pages have their own lightweight UI and must not mount the feed shell.
  // Mounting WallzyShell here still runs its bootstrap effect, which fetches
  // categories, favorites, gradients, and the first 20 wallpapers even though
  // the shell is visually hidden on the detail page.
  if (isWallpaperDetail) return null;
  if (isSearch) return null;
  if (!isKnownShellRoute) return null;
  return <WallzyShell />;
}
