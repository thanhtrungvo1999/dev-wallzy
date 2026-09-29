"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const WallzyShell = dynamic(() => import("./wallzy-shell"), {
  ssr: false,
});

export default function WallzyShellClient() {
  const pathname = usePathname();
  if (pathname?.startsWith("/wallpaper/")) return null;
  return <WallzyShell />;
}
