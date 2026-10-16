# Kellen Miller

A static personal site built with Astro. It presents six public projects, a garage plan, current public GitHub activity, and a writing log. Writing launches empty; starter examples live only in test fixtures.

## Develop

Use Node 24 and npm.

```sh
npm ci
npm run dev
```

Published Markdown or MDX goes in `src/content/blog/`. Required frontmatter is `title`, `description`, and `pubDate`; `updatedDate`, `tag`, and `heroImage` are optional. Every file in that directory becomes a public page and feed item. Keep examples and unpublished drafts elsewhere; `tests/fixtures/blog/` is for isolated rendering checks only.

Project metadata lives in `src/data/projects.ts`. The saved GitHub activity snapshot is `src/data/projects.snapshot.json`. Normal `npm run build` fetches current public activity and falls back to that snapshot on failure. Update the snapshot only from a successful live collection; never replace it with partial data.

Refresh the snapshot from a successful GitHub collection with Node 24. The script checks the result source before writing, so an incomplete fetch leaves the saved file alone. Set `GITHUB_TOKEN` in the shell environment if you need authenticated API limits; the script never prints it.

```sh
node --experimental-strip-types --input-type=module <<'NODE'
import { writeFile } from 'node:fs/promises';
import { fetchProjectsForBuild } from './src/data/github.ts';

const result = await fetchProjectsForBuild('live', new Date());
if (result.source !== 'github') {
  throw new Error('GitHub fetch incomplete; snapshot unchanged');
}

const projects = Object.fromEntries(
  result.projects.map(({ id, commits, build }) => [id, { commits, build }]),
);
await writeFile(
  'src/data/projects.snapshot.json',
  `${JSON.stringify({ asOf: result.asOf, projects }, null, 2)}\n`,
);
console.log(`Snapshot refreshed: ${result.asOf}`);
NODE
```

## Validate

```sh
npm ci
npm run validate
```

`npm run build:test` selects the committed activity snapshot and makes no GitHub requests. `npm run test:ci` builds in snapshot mode before Playwright. `npm run validate` runs formatting, lint, Astro checks, a snapshot build, and browser tests. Playwright uses port 4323 and manages its own preview process. Local fonts are JetBrains Mono and Instrument Sans under their included SIL Open Font Licenses.

## GitHub Pages

The site URL is `https://kellen-miller.github.io`, configured in `astro.config.mjs`. Pull requests run validation; deployments run on pushes to `main` or manual runs on `main` through the shared workflows in `.github/workflows/`.
