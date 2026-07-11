"use client";

import { useEffect } from "react";

/** Registers the "My Day" offline service worker (src/app/sw.ts). No-op in dev (see next.config.mjs). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal — the app works fully online without it; offline caching just won't kick in.
      });
    }
  }, []);
  return null;
}
