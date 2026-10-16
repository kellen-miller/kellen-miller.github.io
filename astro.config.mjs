// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://kellen-miller.github.io',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({ filter: (page) => !page.endsWith('/404.html') }),
  ],
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--mono',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-300-normal.woff2'],
            weight: 300,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-500-normal.woff2'],
            weight: 500,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-600-normal.woff2'],
            weight: 600,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-700-normal.woff2'],
            weight: 700,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/jetbrains-mono-latin-800-normal.woff2'],
            weight: 800,
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--text',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/instrument-sans-latin-400-normal.woff2'],
            weight: 400,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/instrument-sans-latin-500-normal.woff2'],
            weight: 500,
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/instrument-sans-latin-600-normal.woff2'],
            weight: 600,
            style: 'normal',
          },
        ],
      },
    },
  ],
});
