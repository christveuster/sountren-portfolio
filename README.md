# Christian Michael Portfolio

Personal portfolio website for Christian Michael, known online as Sountren. It presents his background, project work, skills, and social profiles.

Live website: https://sountren-portfolio.damianveuster27.workers.dev/

## Built with

- Astro
- React and Three.js for the CRT hero effect
- Cloudflare Workers static assets

## Pages

- `/` — portfolio homepage
- `/links` — social profiles and contact details

## Local development

Use Node.js 22.19 or newer.

```sh
npm install
npm run dev
npm run check
npm run build
```

The `/links` portrait currently uses `public/images/profile-placeholder.svg`. Replace it with a portrait and update the image path in `src/pages/links.astro` when ready.

The Cloudflare Worker serves the generated `dist/` directory. Pushes to `main` trigger the connected deployment.
