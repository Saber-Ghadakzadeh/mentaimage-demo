import { copyFileSync } from 'node:fs';

// GitHub Pages has no SPA rewrite setting. A copy of index.html at 404.html
// lets direct /client, /practitioner and /manufacturer URLs load React Router.
copyFileSync('dist/index.html', 'dist/404.html');
