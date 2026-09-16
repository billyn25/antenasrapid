import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const manifestFile = path.join(root, 'local-pages-manifest.json');
const PHONE = '641 589 394';
const MAX_TITLE = 70;
const MAX_DESCRIPTION = 165;

if (!fs.existsSync(manifestFile)) throw new Error('Falta local-pages-manifest.json');
const localPages = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

function stableHash(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function fitTitle(page, used) {
  const variants = [
    `Antenista en ${page.name}, ${page.province} | ${PHONE}`,
    `Reparación de antenas en ${page.name} | ${PHONE}`,
    `Técnico de antenas en ${page.name} | ${PHONE}`,
    `Antenas y porteros en ${page.name} | ${PHONE}`
  ];
  const start = stableHash(`${page.path}|title-final`) % variants.length;
  const ordered = [...variants.slice(start), ...variants.slice(0, start)];
  const fallbacks = [
    `Antenista en ${page.name} | ${PHONE}`,
    `${page.name} · Antenista | ${PHONE}`,
    `${page.name} · Antenista 24h`,
    `${page.name} · Antenista`
  ];

  let title = [...ordered, ...fallbacks].find(value => value.length <= MAX_TITLE && !used.has(value));
  if (!title) {
    const uniqueFallbacks = [
      `${page.name}, ${page.province} · Antenista`,
      `${page.name} · ${page.province} · Antenista`
    ];
    title = uniqueFallbacks.find(value => value.length <= MAX_TITLE && !used.has(value)) || uniqueFallbacks[0];
  }
  if (used.has(title)) title = `${page.name} · ${page.province} · Antenista`;
  used.add(title);
  return title;
}

function fitDescription(page) {
  const variants = [
    `Antenista en ${page.name}, ${page.province}. Urgencias 24h: ${PHONE}. TDT, parabólicas, amplificación, porteros automáticos y videoporteros.`,
    `Reparación de antenas en ${page.name}, ${page.province}. ${PHONE}. Urgencias 24h, TDT, satélite, amplificación, porteros y videoporteros.`,
    `Técnico de antenas en ${page.name}, ${page.province}. Urgencias 24h: ${PHONE}. TDT, antenas colectivas, parabólicas, porteros y videoporteros.`,
    `Antenas Rapid en ${page.name}, ${page.province}. ${PHONE}. Urgencias 24h para TDT, parabólicas, señal, porteros automáticos y videoporteros.`,
    `Servicio de antenista en ${page.name}, ${page.province}. ${PHONE}. Urgencias 24h. TDT, amplificación, satélite, porteros y videoporteros.`,
    `Antenas y porteros en ${page.name}, ${page.province}. Urgencias 24h: ${PHONE}. TDT, parabólicas, amplificación y videoporteros.`
  ];
  const start = stableHash(`${page.path}|description-final`) % variants.length;
  const ordered = [...variants.slice(start), ...variants.slice(0, start)];
  return ordered.find(value => value.length <= MAX_DESCRIPTION) ||
    `Antenista en ${page.name}, ${page.province}. ${PHONE}. Urgencias 24h. TDT, parabólicas, porteros y videoporteros.`;
}

const usedTitles = new Set();
let maxTitle = 0;
let maxDescription = 0;
for (const page of localPages) {
  const file = path.join(root, page.path.replace(/^\//, ''));
  if (!fs.existsSync(file)) throw new Error(`Falta HTML local ${page.path}`);
  let html = fs.readFileSync(file, 'utf8');

  const oldTitle = html.match(/<title>(.*?)<\/title>/)?.[1];
  const oldDescription = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  if (!oldTitle || !oldDescription) throw new Error(`${page.path}: faltan title o description`);

  const title = fitTitle(page, usedTitles);
  const description = fitDescription(page);
  maxTitle = Math.max(maxTitle, title.length);
  maxDescription = Math.max(maxDescription, description.length);

  html = html.replace(`<title>${oldTitle}</title>`, `<title>${title}</title>`);
  html = html.replace(`<meta property="og:title" content="${oldTitle}">`, `<meta property="og:title" content="${title}">`);
  html = html.replace(`<meta name="description" content="${oldDescription}">`, `<meta name="description" content="${description}">`);
  html = html.replace(`<meta property="og:description" content="${oldDescription}">`, `<meta property="og:description" content="${description}">`);
  fs.writeFileSync(file, html);
}

// Galería procedente de los recursos fotográficos indicados por el propietario.
const gallerySources = [
  'antena1.jpg','antena2.jpg','antena3.jpg','antena4.jpg',
  'antena5.jpg','antena6.jpg','antena7.jpg','antena8.jpg'
];
const galleryDir = path.join(root, 'assets', 'galeria');
fs.mkdirSync(galleryDir, { recursive: true });
const imported = [];

for (let i = 0; i < gallerySources.length; i++) {
  const sourceName = gallerySources[i];
  const url = `https://www.antenaszalla.com/img/galeria/${sourceName}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      headers: { 'user-agent': 'AntenasRapid-gallery-migration' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) continue;
    const type = response.headers.get('content-type') || '';
    if (!type.startsWith('image/')) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 2000) continue;
    const localName = `trabajo-${String(i + 1).padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(galleryDir, localName), bytes);
    imported.push(localName);
  } catch {
    // Si una foto concreta no responde, seguimos con las demás.
  }
}

if (imported.length < 4) throw new Error(`Galería insuficiente: solo se pudieron migrar ${imported.length} imágenes`);

const galleryStyle = `<style id="rapid-gallery-style">
.gallery-section{padding:48px 0;background:#fff;border-top:1px solid var(--line)}
.gallery-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:22px}
.gallery-head h2{margin:8px 0 0}.gallery-head p{max-width:580px;margin:0;color:var(--muted);font-size:14px}
.gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.gallery-grid figure{margin:0;overflow:hidden;border-radius:12px;border:1px solid var(--line);background:#eceae6;aspect-ratio:4/3;box-shadow:0 8px 22px rgba(29,31,35,.07)}
.gallery-grid img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s ease}
.gallery-grid figure:hover img{transform:scale(1.025)}
@media(max-width:900px){.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){.gallery-section{padding:34px 0}.gallery-head{display:block}.gallery-head p{margin-top:8px}.gallery-grid{gap:9px}.gallery-grid figure{border-radius:9px}}
</style>`;
const galleryHtml = `<section class="gallery-section" id="galeria"><div class="wrap"><div class="gallery-head"><div><span class="eyebrow">Trabajos e instalaciones</span><h2>Galería de trabajos</h2></div><p>Una muestra visual de instalaciones y trabajos técnicos de antena.</p></div><div class="gallery-grid">${imported.map((name, index) => `<figure><img src="/assets/galeria/${name}" alt="Trabajo técnico de antena ${index + 1}" loading="lazy" decoding="async" width="640" height="480"></figure>`).join('')}</div></div></section>`;

const homeFile = path.join(root, 'index.html');
let home = fs.readFileSync(homeFile, 'utf8');
if (!home.includes('id="rapid-gallery-style"')) home = home.replace('</head>', `${galleryStyle}</head>`);
if (!home.includes('id="galeria"')) {
  const marker = '<section class="section soft" id="zonas">';
  if (!home.includes(marker)) throw new Error('No se encontró el punto de inserción de la galería en portada');
  home = home.replace(marker, `${galleryHtml}${marker}`);
}
fs.writeFileSync(homeFile, home);

console.log(`SEO/GALERÍA OK: ${localPages.length} páginas locales; title máx. ${maxTitle}, description máx. ${maxDescription}; ${imported.length} imágenes migradas a assets/galeria.`);
