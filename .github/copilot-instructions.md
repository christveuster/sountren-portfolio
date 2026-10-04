# Workspace Guidance

- This is an Astro 7 static site with React islands, TypeScript, and Three.js; deploy the `dist` output as static assets on the existing Cloudflare Worker using `wrangler.jsonc`.
- Keep the CRTWarp effect isolated to the hero React island. Preserve cleanup, resize handling, frame-rate limiting, reduced-motion support, and the static fallback for WebGL failures.
- Keep portfolio content truthful. Do not invent project results, credentials, or education details.
- Keep the supplied profile links in `src/pages/links.astro` accurate and working.
- Maintain the editorial visual direction and avoid the generic landing-page patterns listed in the project brief. The CRT effect is the intentional exception.
- Keep Wrangler's assets directory pointed at `dist/` and use `404-page` handling for the custom not-found page.
- Run `npm run check` and `npm run build` after source changes.
