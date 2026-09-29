"use client";

import { usePathname } from "next/navigation";
import WallzyShell from "./wallzy-shell";

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

  if (!isWallpaperDetail && !isKnownShellRoute) return null;
  return <WallzyShell />;
}
