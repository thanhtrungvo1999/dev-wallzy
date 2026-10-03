"use client";

import { useEffect, useState } from "react";

export default function OrientationGuard() {
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const update = () => setLandscape(window.innerWidth > window.innerHeight);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!landscape) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-8 text-center text-white">
      <div className="max-w-sm">
        <div className="mb-5 text-6xl">📱</div>
        <h2 className="text-xl font-semibold">Vui lòng xoay màn hình</h2>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Wallzy chỉ hỗ trợ chế độ dọc. Vui lòng xoay điện thoại về chế độ dọc để tiếp tục.
        </p>
      </div>
    </div>
  );
}
