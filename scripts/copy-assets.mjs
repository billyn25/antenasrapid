import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const source = path.join('src', 'logo-antenasrapid-clean.webp.b64');
const target = path.join(root, 'assets', 'logo-antenasrapid.webp');

fs.mkdirSync(path.dirname(target), { recursive: true });
const encoded = fs.readFileSync(source, 'utf8').trim();
fs.writeFileSync(target, Buffer.from(encoded, 'base64'));

const home = path.join(root, 'index.html');
if (fs.existsSync(home)) {
  let html = fs.readFileSync(home, 'utf8');
  html = html.replace(/<section class="section soft" id="paginas-locales">[\s\S]*?<\/section>/, '');
  fs.writeFileSync(home, html);
}

const historicRoutes = new Map([
  ['/Antenas-Burgos/aranda-de-duero.html', '/Antenas-Burgos/aranda_duero.html']
]);

const manifestFile = path.join(root, 'local-pages-manifest.json');
let localPages = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : [];

for (const page of localPages) {
  const historic = historicRoutes.get(page.path);
  if (!historic) continue;
  const oldFile = path.join(root, page.path.slice(1));
  const newFile = path.join(root, historic.slice(1));
  if (fs.existsSync(oldFile)) {
    fs.mkdirSync(path.dirname(newFile), { recursive: true });
    fs.renameSync(oldFile, newFile);
  }
  page.path = historic;
}

function replaceHistoricRoutes(text) {
  for (const [from, to] of historicRoutes) {
    text = text.replaceAll(from, to).replaceAll(`https://www.antenasrapid.com${from}`, `https://www.antenasrapid.com${to}`);
  }
  return text;
}

if (localPages.length) {
  fs.writeFileSync(manifestFile, JSON.stringify(localPages, null, 2));
  const previewFile = path.join(root, 'preview-manifest.json');
  if (fs.existsSync(previewFile)) fs.writeFileSync(previewFile, replaceHistoricRoutes(fs.readFileSync(previewFile, 'utf8')));
}

const urgentStyles = `<style id="urgent-24h-style">
.urgent-line{display:flex!important;align-items:flex-end;gap:6px!important;flex-direction:column;margin-top:6px!important;color:#fff!important}
.urgent-24h{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#c3263b;color:#fff;font-size:11px;font-weight:900;line-height:1;letter-spacing:.04em;text-transform:uppercase;box-shadow:0 6px 16px rgba(195,38,59,.25)}
.urgent-24h:before{content:'●';font-size:8px;color:#ffd2d7}
.urgent-hero{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 12px;border-radius:999px;background:#c3263b;color:#fff;font-size:12px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;box-shadow:0 10px 22px rgba(195,38,59,.2)}
.urgent-hero:before{content:'●';font-size:8px;color:#ffd2d7}
.related-towns{margin-top:28px;padding:22px;background:#fff;border:1px solid var(--line);border-radius:12px}.related-towns h3{margin:0 0 8px;font-size:18px}.related-towns p{margin:0 0 12px;color:var(--muted);font-size:13px}.related-town-links{display:flex;flex-wrap:wrap;gap:8px}.related-town-links a{display:inline-flex;padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:13px;font-weight:800}.related-town-links a:hover{background:var(--soft);text-decoration:none}
@media(max-width:760px){.urgent-line{align-items:flex-end}.urgent-24h{font-size:10px;padding:4px 8px}.urgent-hero{font-size:11px;padding:7px 10px;margin-bottom:10px}}
@media(max-width:480px){.urgent-line>span:last-child{display:none}}
</style>`;

function moveSectionBefore(html, sectionId, beforeId) {
  const sectionStart = html.indexOf(`<section class="section wrap" id="${sectionId}">`);
  const beforeStart = html.indexOf(`<section class="doorphones section" id="${beforeId}">`);
  if (sectionStart < 0 || beforeStart < 0 || sectionStart < beforeStart) return html;
  const nextSection = html.indexOf('<section ', sectionStart + 9);
  if (nextSection < 0) return html;
  const block = html.slice(sectionStart, nextSection);
  const without = html.slice(0, sectionStart) + html.slice(nextSection);
  const insertAt = without.indexOf(`<section class="doorphones section" id="${beforeId}">`);
  if (insertAt < 0) return html;
  return without.slice(0, insertAt) + block + without.slice(insertAt);
}

const byProvince = new Map();
for (const page of localPages) {
  if (!byProvince.has(page.province)) byProvince.set(page.province, []);
  byProvince.get(page.province).push(page);
}
for (const list of byProvince.values()) list.sort((a,b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

function relatedTownBlock(page) {
  const list = byProvince.get(page.province) || [];
  if (list.length < 2) return '';
  const index = list.findIndex(p => p.path === page.path);
  const selected = [];
  for (const offset of [-3,-2,-1,1,2,3,4,-4]) {
    if (selected.length >= 6) break;
    const candidate = list[(index + offset + list.length) % list.length];
    if (candidate && candidate.path !== page.path && !selected.some(x => x.path === candidate.path)) selected.push(candidate);
  }
  return `<div class="related-towns"><h3>Servicio de antenista en otros pueblos de ${page.province}</h3><p>Consulta también nuestras páginas de servicio en otros municipios de la provincia.</p><div class="related-town-links">${selected.map(p => `<a href="${p.path}">${p.name}</a>`).join('')}</div></div>`;
}

function strengthenLocalSeo(html, page) {
  const currentTitle = html.match(/<title>(.*?)<\/title>/)?.[1];
  if (currentTitle && !/24h/i.test(currentTitle)) {
    const improved = currentTitle.replace(` | `, ` · Urgencias 24h | `);
    html = html.replace(`<title>${currentTitle}</title>`, `<title>${improved}</title>`);
    html = html.replace(`<meta property="og:title" content="${currentTitle}">`, `<meta property="og:title" content="${improved}">`);
  }
  const desc = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  if (desc && !/Urgencias 24h/i.test(desc)) {
    const improved = `Urgencias 24h. ${desc}`;
    html = html.replace(`<meta name="description" content="${desc}">`, `<meta name="description" content="${improved}">`);
    html = html.replace(`<meta property="og:description" content="${desc}">`, `<meta property="og:description" content="${improved}">`);
  }
  if (!html.includes('class="related-towns"')) {
    const block = relatedTownBlock(page);
    if (block) html = html.replace('<section class="section wrap faq" id="preguntas">', block + '<section class="section wrap faq" id="preguntas">');
  }
  return html;
}

function fixHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) fixHtml(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = replaceHistoricRoutes(fs.readFileSync(file, 'utf8')).replaceAll('Antennistas', 'Antenistas');

      html = moveSectionBefore(html, 'servicios', 'porteros-videoporteros');

      html = html.replace('<small>Consulta tu instalación</small>', '<small class="urgent-line"><span class="urgent-24h">Urgencias 24h</span><span>Consulta tu instalación</span></small>');
      html = html.replace(/(<section class="hero"><div class="wrap hero-inner"><div class="hero-copy">)/, '$1<span class="urgent-hero">Urgencias 24h</span>');
      if (!html.includes('id="urgent-24h-style"')) html = html.replace('</head>', urgentStyles + '</head>');

      html = html.replaceAll('>Porteros y videoporteros<', '>Porteros automáticos y videoporteros<');
      html = html.replaceAll('<strong>Porteros y videoporteros</strong>', '<strong>Porteros automáticos y videoporteros</strong>');

      if (!html.includes('class="nav-mobile-coverage"')) {
        html = html.replace('<a href="#porteros-videoporteros">Porteros automáticos y videoporteros</a>', '<a href="#porteros-videoporteros">Porteros automáticos y videoporteros</a><a class="nav-mobile-coverage" href="#cobertura-movil">Antenas 4G/5G y cobertura móvil</a>');
      }
      if (!html.includes('<span>Cobertura móvil 4G/5G</span>')) {
        html = html.replace('<span>Porteros automáticos y videoporteros</span><span>Instalación y mantenimiento</span>', '<span>Porteros automáticos y videoporteros</span><span>Cobertura móvil 4G/5G</span><span>Instalación y mantenimiento</span>');
      }

      const rel = '/' + path.relative(root, file).split(path.sep).join('/');
      const page = localPages.find(p => p.path === rel);
      if (page) html = strengthenLocalSeo(html, page);

      fs.writeFileSync(file, html);
    }
  }
}
fixHtml(root);

console.log(`ASSET/HTML OK: ${localPages.length} páginas locales reforzadas; Porteros automáticos y videoporteros en accesos, antenas primero, Urgencias 24h en SEO, enlazado provincial y URL histórica de Aranda preservada.`);
