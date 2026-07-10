import type { Config } from "tailwindcss";
import path from "path";

// Absolute paths, anchored to this config file's own directory — not relative to
// process.cwd(). The dev server is launched with an explicit project-directory argument
// (see the launch config workaround for npm/spaces issues on Windows) rather than by having
// its cwd set to this project, and Tailwind resolves relative `content` globs against cwd, not
// against the config file's location — so relative globs silently matched zero files here.
const root = __dirname;

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
      },
    },
  },
  plugins: [],
};
export default config;
