# Kellen Miller

Static personal site built from Astro's official `blog` starter using
`npm create astro@latest -- --template blog`. Includes Markdown/MDX posts,
optimized images, local fonts, RSS, and a sitemap. The example posts are starter
content to replace; the previous Jekyll samples and theme have been removed.

## Develop

Use Node 24 (see `.node-version`) and npm. Commit `package-lock.json` when
dependencies change.

```sh
npm ci
npm run dev
```

Edit site identity in `src/consts.ts`, pages in `src/pages/`, and posts in
`src/content/blog/`. Post frontmatter requires `title`, `description`, and
`pubDate`; `updatedDate` and `heroImage` are optional. New posts appear in the
blog and RSS feed automatically. Assets under `public/` are copied unchanged.

## Validate

```sh
npx playwright install chromium
npm run validate
```

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run format`       | Format supported files, including Astro, MDX, CSS, and YAML             |
| `npm run format:check` | Check formatting without modifying files                                |
| `npm run lint`         | ESLint for JavaScript, TypeScript, Astro, accessibility, and Playwright |
| `npm run check`        | Astro diagnostics and TypeScript checks                                 |
| `npm run build`        | Generate the static site in `dist/`                                     |
| `npm run preview`      | Serve the production build locally                                      |
| `npm test`             | Test the existing production build on desktop and mobile                |
| `npm run test:ci`      | Build, then run browser tests                                           |
| `npm run validate`     | Run formatting, lint, type checks, build, and tests                     |

Browser tests verify navigation, Markdown/MDX output, local links and assets,
canonical metadata, RSS, sitemap, 404 handling, responsive layouts, and
accessibility. They also check that content works without JavaScript. Playwright
starts and stops the production preview itself; build before running `npm test`.
The test preview uses `--ignore-lock` to stay in the foreground when launched by
an AI agent, so Playwright can stop it after the run.
Reports appear in `playwright-report/`; failures retain screenshots and traces
in `test-results/`. CI uploads both directories, including after test failures.

Tooling follows Astro's [editor setup](https://docs.astro.build/en/editor-setup/)
and [testing guidance](https://docs.astro.build/en/guides/testing/):
`eslint-plugin-astro`, the official `prettier-plugin-astro`, `astro check`, and
Playwright against the production preview.

## GitHub Pages

The site URL is `https://kellen-miller.github.io`, configured in
`astro.config.mjs`. This user-site repository needs no project subpath. Set
**Settings → Pages → Build and deployment → Source** to **GitHub Actions**
before the first deployment; the old Jekyll publishing source is incompatible.

`.github/workflows/ci.yml` calls SHA-pinned reusable workflows from
[`kellen-miller/ci`](https://github.com/kellen-miller/ci). Pull requests run
workflow validation, formatting, lint, type checks, the production build, and
Playwright. Validation runs only on pull requests.
`.github/workflows/deploy.yml` handles publishing on pushes to `main` and
manual runs on `main`. The shared Pages workflow builds and uploads `dist/`,
then deploys to the `github-pages` environment. No server or hosting adapter
is required.

Svelte is optional. Add the official integration with `npx astro add svelte`
when an interactive component needs it.
