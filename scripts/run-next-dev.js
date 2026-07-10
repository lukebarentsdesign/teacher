// Wrapper so the dev server's process.cwd() actually matches the project root.
//
// The dev server is launched via an absolute path to node.exe running next's bin script
// directly (not `npm run dev`), because bare `npm`/`next` PATH lookups break in this harness
// when the resolved executable's own path contains spaces (see .claude/launch.json comments /
// CLAUDE.md). That workaround means the process's cwd is whatever the harness's default is,
// not this project directory — which broke Tailwind's config auto-discovery (it searches
// relative to cwd) even after Next.js itself was told the project directory explicitly via a
// CLI argument. chdir here fixes cwd for every cwd-dependent tool at once, not just Tailwind.
process.chdir(require("path").join(__dirname, ".."));
process.argv = [process.argv[0], process.argv[1], "dev"];
require("next/dist/bin/next");
