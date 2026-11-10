// Inlines the built JS and CSS into one HTML file that opens straight from disk (double-click).
// Run after `npm run build` (or scripts/build-esbuild.mjs). Output: dist/slowburn-standalone.html
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const assets = readdirSync('dist/assets');
const js = assets.find((f) => f.endsWith('.js'));
const css = assets.find((f) => f.endsWith('.css'));
let html = readFileSync('dist/index.html', 'utf8');
const jsText = readFileSync(`dist/assets/${js}`, 'utf8').replace(/<\/script/gi, '<\\/script');
const cssText = readFileSync(`dist/assets/${css}`, 'utf8');
html = html
  .replace(/<link rel="stylesheet"[^>]*href="[^"]*\.css"[^>]*>/, `<style>${cssText}</style>`)
  .replace(/<script type="module"[^>]*src="[^"]*\.js"[^>]*><\/script>/, () => `<script type="module">${jsText}</script>`)
  .replace('href="/favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(readFileSync('public/favicon.svg', 'utf8'))}"`);
writeFileSync('dist/slowburn-standalone.html', html);
console.log('wrote dist/slowburn-standalone.html', Math.round(html.length / 1024) + ' KB');
