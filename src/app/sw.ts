import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Deliberately narrow: this is the "My Day" view-only offline feature, not a general
// offline-first app. Only the /dashboard/today navigation, its /api/today data, and the shared
// JS/CSS build assets (needed to render ANY page shell offline) are runtime-cached.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ request }) => request.mode === "navigate",
    handler: new NetworkFirst({ cacheName: "teachbase-pages", networkTimeoutSeconds: 3 }),
  },
  {
    matcher: ({ url }) => url.pathname === "/api/today",
    handler: new NetworkFirst({ cacheName: "teachbase-today-api", networkTimeoutSeconds: 3 }),
  },
  {
    matcher: ({ request }) => ["style", "script", "worker", "font"].includes(request.destination),
    handler: new StaleWhileRevalidate({ cacheName: "teachbase-static-assets" }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
