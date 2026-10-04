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
- `npm run preview` previews the production build.

## Cloudflare Pages

1. Create an empty repository at [github.com/new](https://github.com/new), for example `sountren-portfolio`. Do not add a README, license, or `.gitignore` there.
2. In this project folder, initialize Git and push the site. Replace the remote URL if you chose a different repository name:

	```sh
	git init
	git add .
	git commit -m "Create portfolio site"
	git branch -M main
	git remote add origin https://github.com/christveuster/sountren-portfolio.git
	git push -u origin main
	```

3. Open the [Cloudflare dashboard](https://dash.cloudflare.com/80d9a3716eec3f821dbdeb468cf0848c/home).
4. Go to **Workers & Pages** and select **Create application**.
5. Choose **Pages**, then **Import an existing Git repository**.
6. Connect or authorize GitHub, choose `sountren-portfolio`, and select **Begin setup**.
7. Set the production branch to `main`, the build command to `npm run build`, and the build output directory to `dist`. Leave the root directory at `/`.
8. Select **Save and Deploy**. When the first deployment finishes, open the assigned `*.pages.dev` URL.
9. Check the homepage, `/links`, and an unknown path (for the custom 404). Future pushes to `main` trigger deployments. Configure a custom domain from the Pages project settings if you have one.

This is a static Astro build and does not need the Cloudflare SSR adapter. Astro writes the custom not-found page to `dist/404.html` for Cloudflare Pages to serve on unknown paths.