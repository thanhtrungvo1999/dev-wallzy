"use client";

import { useEffect } from "react";

export default function GlobalTouchRipple() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.closest(`input,textarea,select,[contenteditable="true"]`)) return;

      let layer = document.querySelector<HTMLElement>(".touch-ripple-layer");
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "touch-ripple-layer";
        document.body.appendChild(layer);
      }

      const ripple = document.createElement("span");
      ripple.className = "touch-ripple";
      ripple.style.left = event.clientX + "px";
      ripple.style.top = event.clientY + "px";
      layer.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };

    document.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return null;
}
