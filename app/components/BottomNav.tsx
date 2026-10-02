"use client";

import { useRouter } from "next/navigation";

type BottomNavProps = {
  active: "explore" | "favorites" | "studio" | "tiktok";
};

const items = [
  ["explore", "/", "fa-regular fa-compass", "Explore"],
  ["favorites", "/favorites", "fa-regular fa-heart", "Favorites"],
  ["studio", "/studio", "fa-solid fa-palette", "Studio"],
  ["tiktok", "/tiktok", "fa-brands fa-tiktok", "TikTok"],
] as const;

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  return (
    <footer className="absolute inset-x-6 bottom-12 z-40 flex items-center justify-around rounded-full border border-white/10 bg-[#0a0a0c]/90 px-6 py-2.5 shadow-2xl backdrop-blur-xl">
      {items.map(([key, path, icon, label], index) => (
        <div key={key} className="contents">
          {index > 0 && <div className="h-4 w-px bg-white/10" />}
          <button
            type="button"
            onClick={() => router.push(path)}
            className={
              "flex flex-col items-center space-y-0.5 text-xs transition " +
              (active === key ? "text-white" : "text-gray-400 hover:text-white")
            }
          >
            <i className={icon} />
            <span className="text-[9px] font-semibold">{label}</span>
          </button>
        </div>
      ))}
    </footer>
  );
}
