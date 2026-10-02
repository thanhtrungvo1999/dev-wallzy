"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoading() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = () => setLoading(true);
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      start();
      return originalPushState.apply(this, args as Parameters<typeof history.pushState>);
    };

    history.replaceState = function (...args) {
      start();
      return originalReplaceState.apply(this, args as Parameters<typeof history.replaceState>);
    };

    const onPopState = () => start();
const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.download) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      start();
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/[0.15]">
      <div className="h-9 w-9 rounded-full border-2 border-white/20 border-t-white animate-spin" aria-label="Loading" />
    </div>
  );
}
