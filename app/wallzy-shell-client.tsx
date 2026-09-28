"use client";

import dynamic from "next/dynamic";

const WallzyShell = dynamic(() => import("./wallzy-shell"), {
  ssr: false,
});

export default function WallzyShellClient() {
  return <WallzyShell />;
}
