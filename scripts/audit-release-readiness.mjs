import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const domain = 'https://www.antenasrapid.com';
const forbidden = [
  /VISTA PREVIA/i,
  /versión de revisión/i,
  /página de prueba/i,
  /selección parcial/i,
  /pendiente(?:s)? de revisión/i,
  /inventario .*revisión/i,
  /demo\b/i
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function existsForHref(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return fs.existsSync(path.join(root, 'index.html'));
  const rel = clean.replace(/^\//, '');
  const tries = [
    path.join(root, rel),
    path.join(root, rel + '.html'),
    path.join(root, rel, 'index.html')
  ];
  return tries.some(fs.existsSync);
}

const htmlFiles = walk(root).filter(f => f.endsWith('.html'));
let canonicals = 0;
let checkedLinks = 0;
const broken = [];

for (const file of htmlFiles) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');

  for (const pattern of forbidden) {
    if (pattern.test(html)) throw new Error(`${rel}: texto interno visible detectado: ${pattern}`);
  }
  if (/antenasrapid\.netlify\.app/i.test(html)) throw new Error(`${rel}: contiene referencia a Netlify`);

  const shouldHaveCanonical = rel === 'index.html' || rel.startsWith('Antenas-');
  if (shouldHaveCanonical) {
    const matches = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    if (matches.length !== 1) throw new Error(`${rel}: debe tener exactamente un canonical`);
    if (!matches[0][1].startsWith(domain + '/')) throw new Error(`${rel}: canonical fuera del dominio final`);
    canonicals++;
  }

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    checkedLinks++;
    if (!existsForHref(href)) broken.push(`${rel} -> ${href}`);
  }
}

if (broken.length) throw new Error(`Enlaces internos rotos (${broken.length}): ${broken.slice(0, 20).join(' | ')}`);

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const href of ['/aviso-legal.html','/privacidad.html','/cookies.html']) {
  if (!home.includes(`href="${href}"`)) throw new Error(`Portada: falta enlace legal ${href}`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'local-pages-manifest.json'), 'utf8'));
if (!manifest.length) throw new Error('Manifiesto local vacío');
for (const page of manifest) {
  if (!existsForHref(page.path)) throw new Error(`Falta HTML para ${page.path}`);
}

const cssFile = path.join(root, 'assets', 'site.css');
const css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes('Cierre móvil sin scroll lateral')) throw new Error('CSS: falta el cierre móvil sin scroll lateral');
if (!/@media\(max-width:760px\)[\s\S]*?\.head nav\{[^}]*overflow-x:visible/.test(css)) throw new Error('CSS: el menú móvil sigue dependiendo de scroll horizontal');
if (!/@media\(max-width:480px\)[\s\S]*?\.strip \.wrap\{[^}]*overflow-x:visible!important/.test(css)) throw new Error('CSS: la tira móvil sigue dependiendo de scroll horizontal');

console.log(`CIERRE PREPRODUCCIÓN OK: ${manifest.length} páginas locales, ${canonicals} canonicals finales, ${checkedLinks} enlaces internos comprobados, 0 rotos, 0 textos internos visibles y móvil sin scroll lateral forzado.`);
