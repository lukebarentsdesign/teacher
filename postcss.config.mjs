import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Explicit absolute path, not auto-discovery — the dev server runs with a cwd that
    // doesn't match the project root (see tailwind.config.ts's comment), and Tailwind's
    // own config auto-discovery searches relative to cwd, silently falling back to an
    // empty/default config (content: []) when it can't find tailwind.config.ts there.
    tailwindcss: { config: path.join(__dirname, "tailwind.config.ts") },
  },
};

export default config;
