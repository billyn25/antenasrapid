import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const phone = '641 589 394';
const tel = '+34641589394';

const legalLinks = '<nav class="legal-links" aria-label="Información legal" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin:4px 0 16px"><a href="/aviso-legal.html">Aviso legal</a><span aria-hidden="true" style="opacity:.45">·</span><a href="/privacidad.html">Privacidad y RGPD</a><span aria-hidden="true" style="opacity:.45">·</span><a href="/cookies.html">Cookies</a></nav>';

function injectFooterLinks(html) {
  if (html.includes('class="legal-links"')) return html;
  return html.replace('<p class="fine">', `${legalLinks}<p class="fine">`);
}

function page(title, body) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Antenas Rapid</title><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/assets/site.css?v=cabecera-hero-2"></head><body><main class="wrap section legal-page"><a href="/">← Volver a Antenas Rapid</a><h1>${title}</h1>${body}<p><a href="tel:${tel}">${phone}</a></p></main></body></html>`;
}

for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, injectFooterLinks(html));
}

fs.writeFileSync(path.join(root, 'aviso-legal.html'), page('Aviso legal', `
<p>Antenas Rapid es propiedad de R.F.G.</p>
<p>Este sitio informa sobre servicios de instalación, reparación y mantenimiento de antenas, porteros automáticos, videoporteros y servicios relacionados.</p>
<p>El contenido de esta web tiene carácter informativo y comercial.</p>`));

fs.writeFileSync(path.join(root, 'privacidad.html'), page('Privacidad y RGPD', `
<p>Antenas Rapid, propiedad de R.F.G., trata únicamente los datos que el usuario facilite al contactar de forma voluntaria.</p>
<p>Los datos se utilizan para atender consultas, gestionar avisos y prestar los servicios solicitados.</p>
<p>No se ceden datos a terceros salvo obligación legal o cuando sea necesario para prestar un servicio solicitado por el usuario.</p>
<p>El usuario puede solicitar el acceso, rectificación o supresión de sus datos utilizando los medios de contacto publicados en esta web.</p>`));

fs.writeFileSync(path.join(root, 'cookies.html'), page('Política de cookies', `
<p>Antenas Rapid no utiliza cookies de analítica, publicidad o seguimiento propias en esta web.</p>
<p>Los enlaces a servicios externos pueden estar sujetos a las políticas de cookies de dichos servicios.</p>`));

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

console.log('LEGAL OK: propiedad R.F.G., Aviso legal, Privacidad/RGPD y Cookies con enlaces separados y sin datos inventados.');
