const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'dist', 'popup', 'index.js')],
  bundle: true,
  outfile: path.join(__dirname, '..', 'dist', 'popup.js'),
  format: 'iife',
  target: 'chrome90',
  minify: false,
}).catch(() => process.exit(1));
