import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const phone = '641 589 394';
const tel = '+34641589394';

const legalLinks = '<nav class="legal-links" aria-label="Información legal"><a href="/aviso-legal.html">Aviso legal</a><a href="/privacidad.html">Privacidad y RGPD</a><a href="/cookies.html">Cookies</a></nav>';

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
<p>Esta página forma parte de la versión de revisión de Antenas Rapid.</p>
<p>Los datos identificativos completos del titular, NIF/CIF, domicilio y correo legal deben incorporarse con información real y verificable antes de publicar esta versión en producción.</p>
<p>El sitio informa sobre servicios de instalación, reparación y mantenimiento de antenas, porteros automáticos, videoporteros y soluciones relacionadas.</p>`));

fs.writeFileSync(path.join(root, 'privacidad.html'), page('Privacidad y RGPD', `
<p>En esta versión de revisión no hay formularios de contacto ni analítica propia. El contacto se realiza mediante teléfono o enlaces externos como WhatsApp.</p>
<p>Antes de producción deberán incorporarse los datos reales del responsable del tratamiento, la finalidad, base jurídica, plazos de conservación, destinatarios y medios para ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad.</p>
<p>No se incluyen identidades, domicilios, NIF/CIF ni correos legales ficticios.</p>`));

fs.writeFileSync(path.join(root, 'cookies.html'), page('Política de cookies', `
<p>Esta versión de revisión no instala cookies de analítica, publicidad o personalización desde Antenas Rapid.</p>
<p>Los enlaces a servicios externos pueden llevar a sitios con sus propias políticas. Si en el futuro se incorporan cookies no necesarias, deberán bloquearse hasta obtener el consentimiento correspondiente y se actualizará esta política.</p>`));

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

console.log('LEGAL OK: enlaces de Aviso legal, Privacidad/RGPD y Cookies añadidos sin datos fiscales inventados.');
