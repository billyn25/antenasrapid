import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

export const MADRID_ROUTE = '/Antenas-Madrid/';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validatePostalData(data) {
  assert.equal(data.provinceId, '28', 'El fichero postal debe corresponder a Madrid');
  assert.equal(data.municipalities.length, 179, 'Deben figurar los 179 municipios de Madrid');
  assert.equal(new Set(data.municipalities.map(x => x.id)).size, 179, 'IDs municipales repetidos');
  for (const row of data.municipalities) {
    assert.match(row.id, /^28\d{3}$/, 'Código INE municipal inválido');
    assert.ok(row.name && row.postalCodes.length, `Sin códigos postales: ${row.name}`);
    assert.deepEqual(row.postalCodes, [...new Set(row.postalCodes)].sort(), `Códigos repetidos o desordenados: ${row.name}`);
    for (const code of row.postalCodes) assert.match(code, /^28\d{3}$/, `Código postal inválido: ${row.name}`);
  }
  return data;
}
const codeList = codes => codes.map(code => `<span class="postal-code">${esc(code)}</span>`).join(' ');
function sourceNote(data) {
  return `<p class="postal-source">Códigos asociados a direcciones municipales de <a href="https://www.cartociudad.es/web/portal/directorio-de-servicios/descarga">CartoCiudad (IGN/CNIG)</a>. Consulta de datos: ${esc(data.checkedOn)}. Obra derivada de CartoCiudad, <a href="https://www.scne.es/">CC BY 4.0 · SCNE</a>.</p>`;
}
export function postalBlock(page, row, data) {
  const place = esc(page.name);
  const shown = row.postalCodes.slice(0, 12), rest = row.postalCodes.slice(12);
  return `<section class="section soft postal-coverage" id="codigos-postales"><div class="wrap"><span class="eyebrow">Localiza tu aviso</span><h2>Códigos postales de ${place}</h2><p>Para consultar una instalación o reparación de antena, portero o videoportero en ${place}, indica la calle y el código postal junto al municipio.</p><div class="postal-code-list" aria-label="Códigos postales de ${place}">${codeList(shown)}</div>${rest.length ? `<details class="postal-more"><summary>Ver los ${rest.length} códigos restantes</summary><div class="postal-code-list">${codeList(rest)}</div></details>` : ''}<p class="postal-help">Un municipio puede tener varios códigos y un mismo código puede compartirse entre municipios. Confirma el correspondiente a tu dirección al preparar el aviso.</p>${sourceNote(data)}<a class="text-link" href="${MADRID_ROUTE}#localidades">Buscar otro municipio o código postal de Madrid →</a></div></section>`;
}
export function enrichMadridTown(html, page, row, data) {
  if (!page.path.startsWith(MADRID_ROUTE)) return html;
  if (html.includes('id="codigos-postales"')) throw new Error('El bloque postal ya está insertado');
  const marker = '<section class="section wrap faq" id="preguntas">';
  assert.equal(html.split(marker).length, 2, `${page.path}: punto de inserción postal ausente o duplicado`);
  // Insertar antes de la FAQ sin eliminar su contenedor, clases CSS ni ancla.
  return html.replace(marker, postalBlock(page, row, data) + marker).replace('</head>', '<link rel="stylesheet" href="/assets/madrid-postal.css"></head>');
}
export function enrichMadridDirectory(html, locals, lookup, data) {
  let output = html;
  const indexes = madridServiceIndexes(locals);
  for (const page of locals) {
    const row = lookup.get(String(page.municipioId));
    assert.ok(row, `${page.path}: sin asignación postal`);
    const before = `<li data-town="${esc(page.name)}"><a href="${page.path}">${esc(page.name)} →</a></li>`;
    assert.equal(output.split(before).length, 2, `${page.path}: falta en el directorio de Madrid`);
    const sample = row.postalCodes.slice(0, 4).join(' · ');
    const more = row.postalCodes.length > 4 ? ` · y ${row.postalCodes.length - 4} más` : '';
    output = output.replace(before, `<li data-town="${esc(page.name)} ${row.postalCodes.join(' ')}" data-postal-codes="${row.postalCodes.join(' ')}" data-municipio-id="${row.id}">${madridServiceLink(page,indexes.get(page.path))}<a class="postal-directory-codes" href="${page.path}#codigos-postales">Códigos postales: ${sample}${more}</a></li>`);
  }
  output = output.replace('for="town-search">Buscar localidad</label>', 'for="town-search">Buscar municipio o código postal</label>')
    .replace('placeholder="Escribe el nombre de tu localidad" autocomplete="off">', 'placeholder="Ej.: Alcalá de Henares o 28801" autocomplete="off" aria-describedby="postal-search-help"><p class="postal-help" id="postal-search-help">Busca por nombre o por código postal. Si un código está compartido, se muestran todos los municipios correspondientes. Los 179 municipios se pueden consultar también en el listado.</p>')
    .replace('</head>', '<link rel="stylesheet" href="/assets/madrid-postal.css"></head>');
  const marker = '<section class="section wrap faq" id="preguntas">';
  assert.ok(output.includes(marker), 'Directorio de Madrid sin FAQ');
  return output.replace(marker, `<section class="section wrap postal-province-note">${sourceNote(data)}</section>` + marker);
}

// Un mismo municipio conserva el mismo servicio en portada y directorio.
export const MADRID_LINK_SERVICES = Object.freeze([
  'Antenista', 'Reparación de porteros automáticos', 'Instalación de videoporteros'
]);
export function madridServiceIndexes(locals) {
  const ordered = [...locals].sort((a,b) => a.name === 'Madrid' ? -1 : b.name === 'Madrid' ? 1 : a.name.localeCompare(b.name,'es',{sensitivity:'base'}));
  const result = new Map(ordered.map((page,index) => [page.path,index]));
  assert.equal(result.size, locals.length, 'Madrid: municipios duplicados al asignar servicios');
  return result;
}
export function madridServiceLink(page,index) {
  assert.ok(Number.isInteger(index) && index >= 0, 'Madrid: falta el índice del servicio');
  const label = MADRID_LINK_SERVICES[index % MADRID_LINK_SERVICES.length];
  return `<a class="madrid-service-link" href="${esc(page.path)}"><span class="madrid-service-label">${label} en</span> <strong class="madrid-service-town">${esc(page.name)}<span aria-hidden="true"> →</span></strong></a>`;
}
export function labelMadridHomeLinks(html,locals) {
  if (html.includes('data-madrid-service-links="1"')) return html;
  const marker = '<h3><a href="/Antenas-Madrid/">Madrid</a></h3>';
  if (!html.includes(marker)) return html;
  const indexes = madridServiceIndexes(locals), byPath = new Map(locals.map(page => [page.path,page]));
  let cards = 0, links = 0;
  let output = html.replace(/<article class="featured-province">[\s\S]*?<\/article>/g, card => {
    if (!card.includes(marker)) return card;
    cards++;
    return card.replace('<article class="featured-province">','<article class="featured-province" data-madrid-service-links="1">')
      .replace(/<a href="(\/Antenas-Madrid\/[^"#?]+\.html)">([^<]+)<\/a>/g, (_,href) => {
        const page=byPath.get(href);
        assert.ok(page, `Madrid: destino desconocido ${href}`);
        links++;
        return madridServiceLink(page,indexes.get(href));
      });
  });
  assert.equal(cards,1,'Madrid debe tener una sola tarjeta en portada');
  assert.ok(links>0,'Madrid: no se han encontrado enlaces municipales');
  if (!output.includes('href="/assets/madrid-postal.css"')) output=output.replace('</head>','<link rel="stylesheet" href="/assets/madrid-postal.css"></head>');
  return output;
}

function main() {
  const root = path.resolve('dist');
  const data = validatePostalData(JSON.parse(fs.readFileSync('content/postal-codes-madrid.json','utf8')));
  const lookup = new Map(data.municipalities.map(row => [row.id, row]));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'local-pages-manifest.json'), 'utf8'));
  const locals = manifest.filter(page => page.path.startsWith(MADRID_ROUTE));
  assert.equal(locals.length, 179, 'Cobertura de Madrid incompleta');
  assert.deepEqual(locals.map(x => String(x.municipioId)).sort(), [...lookup.keys()].sort(), 'Municipios postales y páginas no coinciden');
  for (const page of locals) {
    const file = path.join(root, page.path.slice(1));
    fs.writeFileSync(file, enrichMadridTown(fs.readFileSync(file, 'utf8'), page, lookup.get(String(page.municipioId)), data));
  }
  const directoryFile = path.join(root, MADRID_ROUTE.slice(1), 'index.html');
  fs.writeFileSync(directoryFile, enrichMadridDirectory(fs.readFileSync(directoryFile,'utf8'), locals, lookup, data));
  fs.copyFileSync('src/madrid-postal.css',path.join(root,'assets/madrid-postal.css'));
  const homeFile = path.join(root,'index.html');
  let home = fs.readFileSync(homeFile,'utf8');
  const marker = '<h3><a href="/Antenas-Madrid/">Madrid</a></h3>';
  assert.equal(home.split(marker).length,2,'Madrid debe aparecer una vez en destacados');
  home=home.replace(marker,marker+'<p><a href="/Antenas-Madrid/#localidades">Buscar municipio o código postal →</a></p>');
  home=labelMadridHomeLinks(home,locals);
  fs.writeFileSync(homeFile, home);
  const report = {municipalities:locals.length, postalAssignments:data.municipalities.reduce((n,x)=>n+x.postalCodes.length,0), distinctPostalCodes:new Set(data.municipalities.flatMap(x=>x.postalCodes)).size, source:data.source, checkedOn:data.checkedOn};
  fs.writeFileSync(path.join(root,'madrid-postal-report.json'),JSON.stringify(report,null,2));
  console.log('MADRID POSTAL OK:', JSON.stringify(report));
}
if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
