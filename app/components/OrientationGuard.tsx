"use client";

import { useEffect, useState } from "react";

export default function OrientationGuard() {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");

    const update = () => setLandscape(media.matches);

    update();
    media.addEventListener("change", update);

    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  if (!landscape) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-8 text-center text-white">
      <div className="max-w-sm">
        <div className="mb-5 text-6xl">📱</div>
        <h2 className="text-xl font-semibold">Please rotate your screen</h2>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Wallzy only supports portrait mode. Please rotate your phone to portrait mode to continue.
        </p>
      </div>
    </div>
  );
}
