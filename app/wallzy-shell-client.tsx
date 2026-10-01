"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WallzyShell = dynamic(() => import("./wallzy-shell"), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
      <div className="w-20 h-20 rounded-[26px] bg-[#0a0a0c] border border-white/10 flex items-center justify-center shadow-2xl">
        <img
          src="/icons/icon-192.svg"
          alt="Wallzy"
          className="w-full h-full rounded-[25px]"
          draggable={false}
        />
      </div>
    </div>
  ),
});

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
    isCategory ||
    isWallpaperDetail;

  // Keep the shell mounted on wallpaper detail routes so returning to the
  // previous page restores the existing grid, filters, and scroll position.
  if (isSearch) return null;
  if (!isKnownShellRoute) return null;

  return <WallzyShell />;
}
