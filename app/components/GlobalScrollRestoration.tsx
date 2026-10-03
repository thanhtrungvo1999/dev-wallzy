"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "wallzy:scroll-positions:v1";

type PositionMap = Record<string, Record<string, number>>;

function readPositions(): PositionMap {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePositions(value: PositionMap) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
}

function getScrollableElements() {
  return Array.from(document.querySelectorAll<HTMLElement>("body *")).filter((element) => {
    if (element.dataset.wallzyScrollIgnore === "true") return false;
    const style = window.getComputedStyle(element);
    return (
      (style.overflowY === "auto" || style.overflowY === "scroll") &&
      element.scrollHeight > element.clientHeight
    );
  });
}

function getElementKey(element: HTMLElement, index: number) {
  return element.id || element.dataset.wallzyScrollKey || `index-${index}`;
}

export default function GlobalScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const restore = () => {
      const saved = readPositions()[pathname];
      if (!saved) return;

      getScrollableElements().forEach((element, index) => {
        const top = saved[getElementKey(element, index)];
        if (typeof top === "number") element.scrollTop = top;
      });
    };

    const frame = requestAnimationFrame(restore);
    const timers = [0, 100, 250, 500].map((delay) =>
      window.setTimeout(restore, delay),
    );

    return () => {
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname]);

  useEffect(() => {
    if (!pathname) return;

    let frame = 0;

    const save = () => {
      frame = 0;
      const positions = readPositions();
      const page = { ...(positions[pathname] || {}) };

      getScrollableElements().forEach((element, index) => {
        page[getElementKey(element, index)] = element.scrollTop;
      });

      positions[pathname] = page;
      writePositions(positions);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(save);
    };

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
