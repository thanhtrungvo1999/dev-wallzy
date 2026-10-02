"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const start = () => setLoading(true);

    history.pushState = function (...args) {
      start();
      return originalPushState.apply(this, args as Parameters<typeof history.pushState>);
    };

    history.replaceState = function (...args) {
      start();
      return originalReplaceState.apply(this, args as Parameters<typeof history.replaceState>);
    };

    const onPopState = () => start();
    window.addEventListener("popstate", onPopState);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/[0.08]">
      <div
        className="h-9 w-9 rounded-full border-2 border-white/20 border-t-white animate-spin"
        aria-label="Loading"
      />
    </div>
  );
}
