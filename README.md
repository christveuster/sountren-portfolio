# CRT Warp Portfolio

Static developer portfolio built with Astro, React, and Three.js. The landing hero uses CRTWarp as a decorative animated background and falls back to a static treatment when WebGL is unavailable.

## Personalize the content

The portfolio identifies Christian Michael as Sountren and includes the supplied university, skills, interests, Mapperatorinator project, social profiles, and email. Check each public detail before publishing.

## Local commands

- Use Node.js 22.19 or newer.
- `npm install` installs dependencies.
- `npm run dev` starts the development server.
- `npm run check` checks the project.
- `npm run build` creates the production build.
- `npm run deploy` deploys the existing Cloudflare Worker after building.
- `npm run preview` previews the production build.

## Cloudflare Workers

The existing Worker is deployed from GitHub with Workers Builds. `wrangler.jsonc` serves Astro's `dist/` output as static assets on `sountren-portfolio.damianveuster27.workers.dev` and returns `dist/404.html` for unknown routes. It is an assets-only Worker and does not need the Astro Cloudflare SSR adapter.

Workers Builds should use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (or `npm run deploy`)
- Root directory: `/`
- Node.js: 22.19 or newer

Push commits to `main` to trigger deployments. After a deployment, check `/`, `/links`, and an unknown path to verify the home page, link hub, and custom 404.