const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'dist', 'content', 'index.js')],
  bundle: true,
  outfile: path.join(__dirname, '..', 'dist', 'content', 'index.js'),
  format: 'iife',
  target: 'chrome90',
  minify: false,
  allowOverwrite: true,
}).catch(() => process.exit(1));
