import withSerwistInit from "@serwist/next";

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Only the "My Day" offline view is precached (see src/app/sw.ts) — not a general offline-first
// rewrite. Disabled outside production builds so `next dev` doesn't fight a stale cached worker.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
});

export default withSerwist(nextConfig);
