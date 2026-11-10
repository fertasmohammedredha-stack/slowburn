// Fallback build for environments where Vite cannot be installed. Normal projects use `npm run build`.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';

rmSync('dist/assets', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });
await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  minify: true,
  target: 'es2022',
  outfile: 'dist/assets/main.js',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'css' },
});
let html = readFileSync('index.html', 'utf8');
html = html.replace('<script type="module" src="/src/main.jsx"></script>',
  '<link rel="stylesheet" href="/assets/main.css" />\n    <script type="module" src="/assets/main.js"></script>');
writeFileSync('dist/index.html', html);
cpSync('public', 'dist', { recursive: true });
console.log('built dist/');
