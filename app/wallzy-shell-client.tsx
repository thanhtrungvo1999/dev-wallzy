"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WallzyShell = dynamic(() => import("./wallzy-shell"), {
  ssr: false,
});

export default function WallzyShellClient() {
  const pathname = usePathname() || "/";
  const isWallpaperDetail = pathname.startsWith("/wallpaper/");
  const isCategory = pathname.startsWith("/category/");
  const isKnownShellRoute =
    pathname === "/" ||
    pathname === "/studio" ||
    pathname === "/tiktok" ||
    pathname === "/favorites" ||
    isCategory;

  if (isWallpaperDetail || !isKnownShellRoute) return null;
  return <WallzyShell />;
}
