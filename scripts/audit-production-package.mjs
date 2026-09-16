import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.PRODUCTION_ROOT || 'dist');
const domain = 'https://www.antenasrapid.com';

if (!fs.existsSync(root)) throw new Error(`No existe el paquete a auditar: ${root}`);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const htmlFiles = walk(root).filter(file => file.endsWith('.html'));
const excluded = new Set(['404.html', 'aviso-legal.html', 'privacidad.html', 'cookies.html']);
const expectedCanonicals = [];

for (const file of htmlFiles) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');

  if (excluded.has(rel)) continue;

  if (!html.includes('<meta name="robots" content="index,follow">')) {
    throw new Error(`${rel}: falta index,follow en el paquete final`);
  }
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
    throw new Error(`${rel}: conserva noindex en el paquete final`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) throw new Error(`${rel}: falta canonical`);
  if (!canonical.startsWith(domain + '/')) throw new Error(`${rel}: canonical incorrecto ${canonical}`);
  expectedCanonicals.push(canonical);
}

if (expectedCanonicals.length < 3000) {
  throw new Error(`Paquete final incompleto: solo ${expectedCanonicals.length} páginas indexables`);
}
if (new Set(expectedCanonicals).size !== expectedCanonicals.length) {
  throw new Error('Canonicals duplicados en el paquete final');
}

const sitemapFile = path.join(root, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) throw new Error('Falta sitemap.xml');
const sitemap = fs.readFileSync(sitemapFile, 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1].replace(/&amp;/g, '&'));
if (sitemapUrls.length !== expectedCanonicals.length) {
  throw new Error(`Sitemap incompleto: ${sitemapUrls.length} URLs frente a ${expectedCanonicals.length} canonicals`);
}
const expectedSet = new Set(expectedCanonicals);
const sitemapSet = new Set(sitemapUrls);
const missing = expectedCanonicals.filter(url => !sitemapSet.has(url));
const extra = sitemapUrls.filter(url => !expectedSet.has(url));
if (missing.length || extra.length) {
  throw new Error(`Sitemap no coincide con canonicals. Faltan=${missing.slice(0,5).join(', ')} Extras=${extra.slice(0,5).join(', ')}`);
}

const robotsFile = path.join(root, 'robots.txt');
if (!fs.existsSync(robotsFile)) throw new Error('Falta robots.txt');
const robots = fs.readFileSync(robotsFile, 'utf8');
if (!/^User-agent:\s*\*$/mi.test(robots) || !/^Allow:\s*\/$/mi.test(robots)) {
  throw new Error('robots.txt no permite rastreo general');
}
if (!robots.includes(`Sitemap: ${domain}/sitemap.xml`)) {
  throw new Error('robots.txt no declara el sitemap final');
}
if (/Disallow:\s*\//i.test(robots)) throw new Error('robots.txt bloquea el rastreo');

const headersFile = path.join(root, '_headers');
if (fs.existsSync(headersFile)) {
  const headers = fs.readFileSync(headersFile, 'utf8');
  if (/X-Robots-Tag:\s*noindex/i.test(headers)) throw new Error('_headers conserva noindex global');
}

if (fs.existsSync(path.join(root, 'preview-manifest.json'))) {
  throw new Error('El paquete final conserva preview-manifest.json');
}

for (const legal of ['aviso-legal.html', 'privacidad.html', 'cookies.html']) {
  if (!fs.existsSync(path.join(root, legal))) throw new Error(`Falta ${legal}`);
}

console.log(`PAQUETE PRODUCCIÓN OK: ${expectedCanonicals.length} URLs indexables; sitemap completo, robots abierto, canonicals únicos y sin noindex global.`);
