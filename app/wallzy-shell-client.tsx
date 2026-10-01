"use client";

import { usePathname } from "next/navigation";
import WallzyShell from "./wallzy-shell";

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
