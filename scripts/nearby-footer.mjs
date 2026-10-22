import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const STYLE_HREF = '/assets/nearby-footer.css?v=20261022';
const nearbyPattern = () => /<section\b[^>]*\bid="pueblos-cercanos"[^>]*>[\s\S]*?<\/section>/g;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function assertNearbyFooter(html, label = 'Página local') {
  const blocks = [...html.matchAll(nearbyPattern())];
  assert.equal(blocks.length, 1, `${label}: debe haber un único bloque de pueblos cercanos`);
  const block = blocks[0];
  const mainStart = html.indexOf('<main');
  const mainEnd = html.indexOf('</main>');
  const contact = html.indexOf('id="contacto"');
  const footer = html.indexOf('<footer');
  assert(mainStart >= 0 && mainStart < contact && contact < block.index, `${label}: cercanos debe ir después del formulario`);
  assert.equal(html.slice(block.index + block[0].length, mainEnd).trim(), '', `${label}: cercanos debe cerrar el contenido principal`);
  assert(mainEnd > block.index && footer > mainEnd, `${label}: cercanos debe estar antes del pie`);
  assert.equal((block[0].match(/data-nearby-ine=/g) || []).length, 6, `${label}: conservar seis localidades próximas`);
  assert(!/href="(?:tel:|https?:\/\/wa\.me\/)/i.test(block[0]), `${label}: no repetir contactos en cercanos`);
  assert.equal((block[0].match(/class="nearby-all"/g) || []).length, 1, `${label}: falta acceso único a la provincia`);
  assert(html.includes(`href="${STYLE_HREF}"`), `${label}: falta el estilo del cierre`);
}

export function moveNearbyToFooter(html, page) {
  assert(page?.name && page?.province, 'Faltan localidad o provincia');
  assert.match(page.path, /^\/Antenas-[^/]+\/[^/]+\.html$/i, 'Ruta municipal no válida');
  const blocks = [...html.matchAll(nearbyPattern())];
  assert.equal(blocks.length, 1, `${page.path}: navegación próxima ausente o duplicada`);
  assert.equal((html.match(/<main\b/g) || []).length, 1, `${page.path}: contenido principal ambiguo`);
  assert.equal((html.match(/<\/main>/g) || []).length, 1, `${page.path}: falta cierre principal`);
  assert.equal((html.match(/\bid="contacto"/g) || []).length, 1, `${page.path}: contacto ausente o duplicado`);
  assert.equal((html.match(/\bdata-whatsapp-form(?=\s|>)/g) || []).length, 1, `${page.path}: falta el formulario único`);
  let block = blocks[0][0];
  const original = block;
  if (!block.includes('data-nearby-placement=')) {
    block = block.replace(/(<section\b[^>]*)(>)/, '$1 data-nearby-placement="before-footer"$2');
    block = block.replace(/<h3>Localidades próximas a [\s\S]*?<\/h3>/,
      `<h2>También atendemos en localidades próximas a ${escape(page.name)}</h2>`);
    block = block.replace('Páginas de antenista en municipios próximos con información de sus servicios. Puedes consultar otra localidad si la instalación está allí.',
      'Consulta otra localidad si tu instalación está en un municipio cercano.');
    const provinceRoute = page.path.slice(0, page.path.lastIndexOf('/') + 1);
    const ending = '</div></div></section>';
    assert(block.endsWith(ending), `${page.path}: estructura de cercanos inesperada`);
    block = block.slice(0, -ending.length)
      + `<a class="nearby-all" href="${escape(provinceRoute)}#localidades">Ver todos los municipios de ${escape(page.province)} <span aria-hidden="true">→</span></a>`
      + ending;
  }
  // Mover el HTML original conserva los seis destinos, las distancias y el anillo provincial.
  let result = html.replace(original, '').replace('</main>', `${block}</main>`);
  if (!result.includes(`href="${STYLE_HREF}"`)) {
    assert(result.includes('</head>'), `${page.path}: falta cabecera HTML`);
    result = result.replace('</head>', `<link rel="stylesheet" href="${STYLE_HREF}"></head>`);
  }
  assertNearbyFooter(result, page.path);
  return result;
}

export function applyNearbyFooter(root = 'dist', auditOnly = false) {
  const folder = path.resolve(root);
  const pages = JSON.parse(fs.readFileSync(path.join(folder, 'local-pages-manifest.json'), 'utf8'));
  assert(Array.isArray(pages) && pages.length > 0, 'Falta el inventario municipal');
  assert.equal(new Set(pages.map(page => page.path)).size, pages.length, 'Rutas municipales duplicadas');
  for (const page of pages) {
    const file = path.resolve(folder, `.${page.path}`);
    assert(file.startsWith(folder + path.sep), 'Ruta fuera del directorio de salida');
    const html = fs.readFileSync(file, 'utf8');
    if (auditOnly) assertNearbyFooter(html, page.path);
    else fs.writeFileSync(file, moveNearbyToFooter(html, page));
  }
  const stylesheet = path.join(folder, 'assets', 'nearby-footer.css');
  if (auditOnly) assert(fs.statSync(stylesheet).size > 0, 'Falta el CSS de pueblos cercanos');
  else fs.copyFileSync(new URL('../src/nearby-footer.css', import.meta.url), stylesheet);
  console.log(`CIERRE MUNICIPAL OK: ${pages.length} páginas, un bloque de seis cercanos después del formulario y antes del pie.`);
  return pages.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  applyNearbyFooter('dist', process.argv.includes('--audit'));
}
