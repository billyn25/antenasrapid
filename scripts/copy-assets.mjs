import fs from 'node:fs';
import path from 'node:path';

const source = path.join('src', 'logo-antenasrapid-clean.webp.b64');
const target = path.join('dist', 'assets', 'logo-antenasrapid.webp');

fs.mkdirSync(path.dirname(target), { recursive: true });
const encoded = fs.readFileSync(source, 'utf8').trim();
fs.writeFileSync(target, Buffer.from(encoded, 'base64'));

const home = path.join('dist', 'index.html');
if (fs.existsSync(home)) {
  let html = fs.readFileSync(home, 'utf8');
  html = html.replace(/<section class="section soft" id="paginas-locales">[\s\S]*?<\/section>/, '');
  fs.writeFileSync(home, html);
}

function fixHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) fixHtml(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const html = fs.readFileSync(file, 'utf8').replaceAll('Antennistas', 'Antenistas');
      fs.writeFileSync(file, html);
    }
  }
}
fixHtml('dist');

console.log('ASSET/HTML OK: logo limpio, portada sin bloque duplicado y textos revisados');
