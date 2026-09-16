import fs from 'node:fs';
import path from 'node:path';

if (process.env.CONFIRM_PRODUCTION_PREP !== '1') {
  throw new Error('Preparación de producción bloqueada. Usa CONFIRM_PRODUCTION_PREP=1 solo en el cambio final o en la auditoría aislada.');
}

const root = path.resolve(process.env.PRODUCTION_ROOT || 'dist');
const domain = 'https://www.antenasrapid.com';

if (!fs.existsSync(root)) throw new Error(`No existe el directorio a preparar: ${root}`);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const urls = [];
for (const file of walk(root).filter(f => f.endsWith('.html'))) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  if (rel === '404.html' || ['aviso-legal.html','privacidad.html','cookies.html'].includes(rel)) continue;

  let html = fs.readFileSync(file, 'utf8');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) throw new Error(`${rel}: falta canonical antes de preparar producción`);
  if (!canonical.startsWith(domain + '/')) throw new Error(`${rel}: canonical fuera del dominio final`);

  html = html.replace('<meta name="robots" content="noindex,nofollow">', '<meta name="robots" content="index,follow">');
  if (!html.includes('<meta name="robots" content="index,follow">')) {
    throw new Error(`${rel}: no se pudo activar index,follow`);
  }
  fs.writeFileSync(file, html);
  urls.push(canonical);
}

const unique = [...new Set(urls)].sort((a,b) => a.localeCompare(b, 'es'));
if (unique.length !== urls.length) throw new Error('Hay canonicals duplicados en el sitemap');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique.map(url => `  <url><loc>${url.replace(/&/g,'&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${domain}/sitemap.xml\n`);

const headersFile = path.join(root, '_headers');
if (fs.existsSync(headersFile)) {
  const headers = fs.readFileSync(headersFile, 'utf8')
    .split('\n')
    .filter(line => !/X-Robots-Tag:\s*noindex/i.test(line))
    .join('\n');
  fs.writeFileSync(headersFile, headers);
}

const previewManifest = path.join(root, 'preview-manifest.json');
if (fs.existsSync(previewManifest)) fs.rmSync(previewManifest);

console.log(`PRODUCCIÓN PREPARADA: ${unique.length} URLs indexables, sitemap.xml y robots.txt listos en ${root}. El noindex global de netlify.toml se retira únicamente en el cambio final del dominio.`);
