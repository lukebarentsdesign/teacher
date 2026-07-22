import type { Config } from "tailwindcss";
import path from "path";
import { fileURLToPath } from "url";

// Absolute paths, anchored to this config file's own directory — not relative to
// process.cwd(). The dev server is launched with an explicit project-directory argument
// (see the launch config workaround for npm/spaces issues on Windows) rather than by having
// its cwd set to this project, and Tailwind resolves relative `content` globs against cwd, not
// against the config file's location — so relative globs silently matched zero files here.
//
// Resolved via import.meta.url rather than __dirname: Tailwind's own config loader (jiti)
// sometimes loads this file through Node's native require(esm) interop path, under which this
// is a genuine ES module and __dirname is undefined — import.meta.url is always available and
// correct there, same fix already applied to postcss.config.mjs for the identical problem.
const root = path.dirname(fileURLToPath(import.meta.url));

const config: Config = {
  content: [
    path.join(root, "src/pages/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(root, "src/components/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(root, "src/app/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Warm "paper" neutral scale (Tailwind stone), remapping the default cool `neutral`
        // that every page already references — so the whole app warms up without touching
        // 40+ files. Headings/buttons stay near-black, just warmer and less clinical.
        neutral: {
          50: "#faf9f7",
          100: "#f5f4f1",
          200: "#e8e6e1",
          300: "#d6d3cc",
          400: "#a8a39a",
          500: "#78746b",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          950: "#0c0a09",
        },
        // Single deliberate accent — a calm, trustworthy indigo. Used for focus rings, links,
        // and active navigation, not slathered everywhere.
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(28, 25, 23, 0.05)",
        card: "0 1px 3px 0 rgba(28, 25, 23, 0.06), 0 1px 2px -1px rgba(28, 25, 23, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
