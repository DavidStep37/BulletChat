const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const distContent = path.join(distDir, 'content');
const iconsSrcDir = path.join(root, 'assets', 'icons');
const iconsDistDir = path.join(distDir, 'icons');

if (!fs.existsSync(distContent)) fs.mkdirSync(distContent, { recursive: true });
if (!fs.existsSync(iconsDistDir)) fs.mkdirSync(iconsDistDir, { recursive: true });
fs.copyFileSync(path.join(root, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(root, 'src', 'ui', 'styles.css'), path.join(distContent, 'styles.css'));
fs.copyFileSync(path.join(root, 'popup.html'), path.join(distDir, 'popup.html'));
fs.copyFileSync(path.join(root, 'src', 'popup', 'popup.css'), path.join(distDir, 'popup.css'));

for (const file of fs.readdirSync(iconsSrcDir)) {
  fs.copyFileSync(path.join(iconsSrcDir, file), path.join(iconsDistDir, file));
}

console.log('Copied manifest, styles, popup, and icons to dist/');
