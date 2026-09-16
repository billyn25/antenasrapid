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

const urgentStyles = `<style id="urgent-24h-style">
.urgent-line{display:flex!important;align-items:flex-end;gap:6px!important;flex-direction:column;margin-top:6px!important;color:#fff!important}
.urgent-24h{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:#c3263b;color:#fff;font-size:11px;font-weight:900;line-height:1;letter-spacing:.04em;text-transform:uppercase;box-shadow:0 6px 16px rgba(195,38,59,.25)}
.urgent-24h:before{content:'●';font-size:8px;color:#ffd2d7}
.urgent-hero{display:inline-flex;align-items:center;gap:8px;margin:0 0 12px;padding:8px 12px;border-radius:999px;background:#c3263b;color:#fff;font-size:12px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;box-shadow:0 10px 22px rgba(195,38,59,.2)}
.urgent-hero:before{content:'●';font-size:8px;color:#ffd2d7}
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

function fixHtml(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) fixHtml(file);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = fs.readFileSync(file, 'utf8').replaceAll('Antennistas', 'Antenistas');

      // Orden comercial: primero antenas/servicios; luego porteros, cobertura móvil,
      // experiencia/estrellas y marcas. Evita que las marcas aparezcan antes del servicio principal.
      html = moveSectionBefore(html, 'servicios', 'porteros-videoporteros');

      // Urgencias 24h visibles en cabecera y hero.
      html = html.replace('<small>Consulta tu instalación</small>', '<small class="urgent-line"><span class="urgent-24h">Urgencias 24h</span><span>Consulta tu instalación</span></small>');
      html = html.replace(/(<section class="hero"><div class="wrap hero-inner"><div class="hero-copy">)/, '$1<span class="urgent-hero">Urgencias 24h</span>');
      if (!html.includes('id="urgent-24h-style"')) html = html.replace('</head>', urgentStyles + '</head>');

      // Acceso rápido directo a cobertura móvil / antenas 4G-5G.
      if (!html.includes('class="nav-mobile-coverage"')) {
        html = html.replace(
          '<a href="#porteros-videoporteros">Porteros y videoporteros</a>',
          '<a href="#porteros-videoporteros">Porteros y videoporteros</a><a class="nav-mobile-coverage" href="#cobertura-movil">Antenas 4G/5G y cobertura móvil</a>'
        );
      }
      if (!html.includes('<span>Cobertura móvil 4G/5G</span>')) {
        html = html.replace(
          '<span>Porteros automáticos y videoporteros</span><span>Instalación y mantenimiento</span>',
          '<span>Porteros automáticos y videoporteros</span><span>Cobertura móvil 4G/5G</span><span>Instalación y mantenimiento</span>'
        );
      }

      fs.writeFileSync(file, html);
    }
  }
}
fixHtml('dist');

console.log('ASSET/HTML OK: servicios de antenas primero, luego porteros, cobertura móvil, confianza y marcas; Urgencias 24h y accesos 4G/5G visibles');
