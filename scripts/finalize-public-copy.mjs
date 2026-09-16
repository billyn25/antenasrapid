import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&middot;/gi, ' · ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const forbiddenVisible = [
  /vista previa/i,
  /modo de revisión/i,
  /versión de revisión/i,
  /pendiente(?:s)? de revisión/i,
  /página de prueba/i,
  /página local generada/i,
  /generada para esa localidad/i,
  /selección parcial/i,
  /web actual permanece/i,
  /no sustituye la web actual/i,
  /\bnoindex\b/i,
  /\bpreview\b/i,
  /\bdemo\b/i,
  /\btest\b/i
];

let changed = 0;
for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // Ningún texto interno de desarrollo debe quedar visible para el cliente.
  // El noindex técnico de la preview se conserva únicamente en <head>/cabeceras.
  html = html
    .replace(/<div class="preview">[\s\S]*?<\/div>/gi, '')
    .replaceAll('Los nombres enlazados ya disponen de una página de prueba.', 'Selecciona tu municipio para consultar los servicios disponibles.')
    .replaceAll('Buscar en esta selección', 'Buscar municipio')
    .replaceAll(' localidades en esta selección', ' municipios disponibles')
    .replaceAll('Cada enlace abre una página local generada para esa localidad. La web continúa en modo de revisión y noindex.', 'Selecciona un municipio para consultar sus servicios de antenas, porteros y videoporteros.')
    .replaceAll('Cada enlace abre una página local generada para esa localidad.', 'Selecciona un municipio para consultar sus servicios de antenas, porteros y videoporteros.')
    .replaceAll('La web continúa en modo de revisión y noindex.', '')
    .replace(/<p class="notice">[^<]*(?:vista previa|modo de revisión|noindex|página de prueba|selección parcial|web actual|generada para esa localidad)[^<]*<\/p>/gi, '')
    .replace(/<details><summary>Información de esta vista previa y privacidad<\/summary><p>[\s\S]*?<\/p><\/details>/gi, '')
    .replaceAll('Antenas Rapid · Versión de revisión. La web actual permanece en su alojamiento. Fotografías y listado completo de localidades pendientes de revisión.', 'Antenas Rapid · Propiedad de R.F.G. · 641 589 394')
    .replaceAll('Página no incluida en esta vista previa', 'Página no disponible')
    .replaceAll('El inventario de la renovación está en revisión. Esto no indica que la página se haya eliminado de la web actual.', 'La dirección solicitada no está disponible. Puedes volver al inicio o contactar con Antenas Rapid.');

  const visible = visibleText(html);
  for (const pattern of forbiddenVisible) {
    if (pattern.test(visible)) {
      const rel = path.relative(root, file).split(path.sep).join('/');
      throw new Error(`${rel}: queda texto interno visible: ${pattern}`);
    }
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed++;
  }
}

// Cierre responsive: en móvil ningún bloque principal depende de scroll horizontal
// y evitamos repetir la misma llamada a la acción en el hero y en la barra fija.
const cssFile = path.join(root, 'assets', 'site.css');
const mobileOverflowFix = `

/* Cierre móvil sin scroll lateral */
@media(max-width:760px){
  .head nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 10px;overflow-x:visible;scrollbar-width:none}
  .head nav a{white-space:normal;text-align:center;line-height:1.25;padding:7px 4px;min-width:0}
}
@media(max-width:640px){
  .head{grid-template-columns:minmax(0,1fr) auto;column-gap:10px;padding-block:7px 0}
  .brand{width:min(205px,100%)}
  .brand-tagline{font-size:9px;margin:-2px 0 5px}
  .contact-top{padding-left:10px}
  .contact-top a{font-size:20px;line-height:1.15}
  .contact-top small{font-size:10px}
  .urgent-line{gap:3px!important;margin-top:3px!important}
  .urgent-24h{font-size:9px!important;padding:4px 7px!important}
  .head nav{grid-template-columns:repeat(5,minmax(0,1fr));gap:0!important;border-top:1px solid #48494e}
  .head nav a{min-height:44px;padding:7px 2px!important;font-size:0!important;white-space:normal!important;line-height:1.1!important;border-left:1px solid rgba(255,255,255,.08)}
  .head nav a:first-child{border-left:0}
  .head nav a::after{font-size:10px;font-weight:800}
  .head nav a:nth-child(1)::after{content:'Antenas'}
  .head nav a:nth-child(2)::after{content:'Porteros'}
  .head nav a:nth-child(3)::after{content:'4G/5G'}
  .head nav a:nth-child(4)::after{content:'Pueblos'}
  .head nav a:nth-child(5)::after{content:'Contacto'}
  .hero .actions{display:none!important}
}
@media(max-width:480px){
  .strip .wrap{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;overflow-x:visible!important;flex-wrap:wrap!important;padding-bottom:14px!important}
  .strip span{white-space:normal!important;min-width:0!important;max-width:100%;display:flex;align-items:center}
  .strip span:last-child{grid-column:1/-1}
}
@media(max-width:380px){
  .brand{width:min(180px,100%)}
  .contact-top a{font-size:18px}
  .head nav a::after{font-size:9px}
}
@media(max-width:359px){
  .strip .wrap{grid-template-columns:1fr!important}
  .strip span:last-child{grid-column:auto}
}
`;
if (fs.existsSync(cssFile)) {
  let css = fs.readFileSync(cssFile, 'utf8');
  css = css.replace(/\n\n\/\* Cierre móvil sin scroll lateral \*\/[\s\S]*$/m, '');
  fs.writeFileSync(cssFile, css + mobileOverflowFix);
}

console.log(`COPY FINAL OK: ${changed} HTML limpiados; 0 textos visibles de preview/desarrollo y móvil cerrado.`);
