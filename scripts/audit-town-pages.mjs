import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import pages from '../content/pages.json' with { type: 'json' };
import site from '../config/site.json' with { type: 'json' };
import { routeFile, esc } from './build.mjs';
import { MADRID_CONTACT } from './madrid-contact.mjs';
import { formatReceptionLocality } from './tv-reception.mjs';

const root = path.resolve('dist');
const manifestPath = path.join(root, 'local-pages-manifest.json');
assert.ok(fs.existsSync(manifestPath), 'Falta local-pages-manifest.json');
const localPages = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const provinces = pages.filter(p => p.type === 'province');
assert.ok(localPages.length >= 700, `Expansión incompleta: solo ${localPages.length} páginas locales`);

const antenistaCercaPhrases = [
  'Servicio de proximidad',
  'Trato directo con el técnico',
  'Información útil para',
  'Te atiende una persona que conoce el trabajo',
  'sin centralitas ni intermediarios',
  'trataremos de atenderte lo antes posible'
];
const inventedLocalPatterns = [
  /más de\s+\d+\s+reparaciones/i,
  /\d+\s*(?:minutos|min)\s+(?:de llegada|aproximadamente|aprox)/i,
  /llegamos en\s+\d+/i,
  /técnico de la zona/i,
  /oficina en\s+[A-ZÁÉÍÓÚÑ]/i,
  /sede en\s+[A-ZÁÉÍÓÚÑ]/i,
  /trabajos realizados en\s+[A-ZÁÉÍÓÚÑ]/i,
  /clientes de\s+[A-ZÁÉÍÓÚÑ].*nos recomiendan/i
];

function checkPresentation(html, route) {
  const header = html.match(/<header>([\s\S]*?)<\/header>/)?.[1];
  assert.ok(header, `${route}: falta cabecera`);
  assert.equal((header.match(/class="rapid-brand-logo"/g) || []).length, 1, `${route}: debe haber un solo logo`);
  assert.ok(!/class="wordmark"|<em>RAPID<\/em>/.test(header), `${route}: nombre duplicado junto al logo`);
  assert.equal((header.match(/class="brand-tagline"/g) || []).length, 1, `${route}: subtítulo de marca`);
  assert.ok(html.includes('class="hero-copy"'), `${route}: falta el hero corregido`);
  assert.ok(html.includes('Urgencias 24h'), `${route}: Urgencias 24h no visible`);
  assert.ok(html.includes('class="nav-mobile-coverage"'), `${route}: falta acceso rápido 4G/5G`);
  assert.ok(!html.includes('id="paginas-locales"'), `${route}: bloque técnico duplicado en la página comercial`);

  const antenas = html.indexOf('id="servicios"');
  const porteros = html.indexOf('id="porteros-videoporteros"');
  const movil = html.indexOf('id="cobertura-movil"');
  const experiencia = html.indexOf('id="experiencia"');
  assert.ok(antenas > -1 && porteros > antenas, `${route}: Antenas debe ir antes que porteros`);
  assert.ok(movil > porteros, `${route}: cobertura móvil debe ir después de porteros`);
  assert.ok(experiencia > movil, `${route}: experiencia/marcas deben ir después de los servicios`);
}

function normalizeVisible(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\b\d{3}\s?\d{3}\s?\d{3}\b/g, ' PHONE ')
    .replace(/\s+/g, ' ')
    .trim();
}

const paths = new Set();
const titles = new Set();
const descriptions = new Set();
const titlePatterns = new Set();
const descriptionPatterns = new Set();
const localVariants = new Set();
const localBodyFingerprints = new Map();
const mainPhonePatterns = [site.phone, MADRID_CONTACT.phone].map(phone => new RegExp(
  '(?:^|\\D)(?:\\+?34[\\s().-]*)?' + phone.replace(/\D/g, '').split('').join('[\\s().-]*') + '(?:\\D|$)'
));

for (const page of localPages) {
  assert.ok(!paths.has(page.path), `Ruta local duplicada: ${page.path}`);
  paths.add(page.path);
  const file = path.join(root, routeFile(page.path));
  assert.ok(fs.existsSync(file), `Falta HTML local: ${page.path}`);
  const html = fs.readFileSync(file, 'utf8');
  checkPresentation(html, page.path);

  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page.path}: debe tener un H1`);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/, `${page.path}: noindex de preview`);
  assert.ok(html.includes(`href="${new URL(page.path, site.domain).href}"`), `${page.path}: canonical propio`);
  assert.ok(html.includes(`Antenista en ${page.name}`), `${page.path}: intención antenista + pueblo`);
  for (const id of ['tdt','porteros','videoporteros','cobertura-movil-servicio']) assert.ok(html.includes(`id="${id}"`), `${page.path}: servicio ausente ${id}`);
  assert.ok(html.includes(site.phone), `${page.path}: teléfono`);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  assert.ok(main, `${page.path}: falta contenido principal`);
  assert.ok(!/\bhref\s*=\s*["'](?:tel:|(?:https?:)?\/\/wa\.me(?:\/|[?#"']))/i.test(main), `${page.path}: contacto directo repetido dentro del contenido principal`);
  const visibleMain = main
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ');
  for (const pattern of mainPhonePatterns) assert.ok(!pattern.test(visibleMain), `${page.path}: teléfono visible repetido dentro del contenido principal`);
  assert.equal((main.match(/<form\b/g) || []).length, 1, `${page.path}: debe haber un solo formulario`);
  assert.equal((html.match(/\bid="contacto"/g) || []).length, 1, `${page.path}: debe haber un único destino de contacto`);
  assert.equal((main.match(/\bdata-whatsapp-form(?=\s|>)/g) || []).length, 1, `${page.path}: debe haber un solo formulario de WhatsApp`);
  const contactSection = main.match(/<section\b[^>]*\bid="contacto"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(contactSection && /<form\b[^>]*\bdata-whatsapp-form(?=\s|>)/.test(contactSection), `${page.path}: el formulario debe estar en la sección de contacto`);
  const receptionSections = [...main.matchAll(/<section\b[^>]*\bid="problemas-tdt"[^>]*>([\s\S]*?)<\/section>/g)];
  assert.equal(receptionSections.length, 1, `${page.path}: debe haber una sola guía de problemas de televisión`);
  const receptionSection = receptionSections[0][0];
  assert.equal((receptionSection.match(/<details\b/g) || []).length, 3, `${page.path}: tres preguntas de recepción`);
  assert.ok(receptionSection.includes(esc(formatReceptionLocality(page.name))), `${page.path}: falta el municipio en la guía de recepción`);
  assert.ok(main.indexOf('id="problemas-tdt"') < main.indexOf('id="contacto"'), `${page.path}: guía antes del formulario`);
  assert.ok(receptionSection.includes('data-contact-service="tdt"'), `${page.path}: consulta de recepción sin servicio TDT`);
  for (const name of ['channels', 'timing']) assert.ok(contactSection.includes(`name="${name}"`), `${page.path}: falta el campo ${name}`);
  assert.ok(!/AggregateRating|Review/.test(html), `${page.path}: no inventar reseñas estructuradas`);
  assert.ok(html.includes('class="related-towns"'), `${page.path}: falta enlazado interno a otros pueblos`);
  assert.ok((html.match(/class="related-town-links"[\s\S]*?<\/div>/)?.[0].match(/<a href=/g) || []).length >= 4, `${page.path}: pocos enlaces internos a pueblos`);

  for (const phrase of antenistaCercaPhrases) {
    assert.ok(!html.includes(phrase), `${page.path}: reutiliza frase propia de Antenista Cerca: ${phrase}`);
  }
  for (const pattern of inventedLocalPatterns) {
    assert.ok(!pattern.test(html), `${page.path}: posible dato local no verificado: ${pattern}`);
  }

  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  assert.ok(title && /Urgencias 24h/i.test(title), `${page.path}: título sin Urgencias 24h`);
  assert.ok(description && /Urgencias 24h/i.test(description), `${page.path}: meta description sin Urgencias 24h`);
  assert.ok(title && !titles.has(title), `${page.path}: título duplicado`);
  assert.ok(description && !descriptions.has(description), `${page.path}: meta description duplicada`);
  assert.ok(title.length >= 42 && title.length <= 100, `${page.path}: longitud de title poco cuidada (${title.length})`);
  assert.ok(description.length >= 115 && description.length <= 190, `${page.path}: longitud de meta description poco cuidada (${description.length})`);
  titles.add(title);
  descriptions.add(description);

  titlePatterns.add(title.replace(page.name, 'LOCALIDAD').replace(page.province || '', 'PROVINCIA').replace(site.phone, 'PHONE'));
  descriptionPatterns.add(description.replace(page.name, 'LOCALIDAD').replace(page.province || '', 'PROVINCIA').replace(site.phone, 'PHONE'));

  const serviceSchemaText = html.match(/<script id="local-service-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(serviceSchemaText, `${page.path}: falta schema Service local`);
  const serviceSchema = JSON.parse(serviceSchemaText);
  assert.equal(serviceSchema['@type'], 'Service', `${page.path}: schema local debe ser Service`);
  assert.equal(serviceSchema.areaServed?.name, `${page.name}, ${page.province}`, `${page.path}: areaServed incorrecta`);
  assert.equal(serviceSchema.telephone, site.tel, `${page.path}: teléfono de schema incorrecto`);
  assert.ok(!serviceSchema.address, `${page.path}: no inventar dirección en schema`);
  assert.ok(Array.isArray(serviceSchema.serviceType) && serviceSchema.serviceType.length >= 5, `${page.path}: serviceType insuficiente`);

  const variant = html.match(/data-local-variant="(\d+)"/)?.[1];
  if (variant) localVariants.add(variant);

  // After consolidation the local-intent block is a service menu. Measure the
  // developed technical content, not intentionally shared navigation labels.
  const localBlock = html.includes('data-editorial-consolidation=')
    ? html.match(/<section class="section wrap technical-services"[\s\S]*?<\/section>/)?.[0] || ''
    : html.match(/<section class="section soft local-intent-section"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(localBlock, `${page.path}: falta contenido desarrollado para auditar`);
  const normalized = normalizeVisible(localBlock)
    .replaceAll(page.name, 'LOCALIDAD')
    .replaceAll(page.province || '', 'PROVINCIA');
  if (normalized) {
    const count = localBodyFingerprints.get(normalized) || 0;
    localBodyFingerprints.set(normalized, count + 1);
  }
}

assert.ok(titlePatterns.size >= 4, `Poca variedad de title SEO: ${titlePatterns.size} patrones`);
assert.ok(descriptionPatterns.size >= 6, `Poca variedad de meta descriptions: ${descriptionPatterns.size} patrones`);
const largestFingerprintGroup = Math.max(...localBodyFingerprints.values());
assert.ok(largestFingerprintGroup <= 12, `Demasiadas páginas locales con el mismo bloque normalizado: ${largestFingerprintGroup}`);

const historicalRoutes = [
  { name: 'Bilbao', province: 'Bizkaia', path: '/Antenas-Bizkaia/bilbao.html' },
  { name: 'Aranda de Duero', province: 'Burgos', path: '/Antenas-Burgos/aranda_duero.html' },
  { name: 'Lerma', province: 'Burgos', path: '/Antenas-Burgos/lerma.html' }
];
for (const expected of historicalRoutes) {
  const page = localPages.find(p => p.name === expected.name && p.province === expected.province);
  assert.ok(page, `Falta ${expected.name} en el manifiesto local`);
  assert.equal(page.path, expected.path, `${expected.name} debe conservar su URL histórica`);
  assert.ok(fs.existsSync(path.join(root, expected.path.slice(1))), `Falta HTML histórico de ${expected.name}`);
}
assert.ok(!fs.existsSync(path.join(root, 'Antenas-Burgos', 'aranda-de-duero.html')), 'No crear URL paralela para Aranda de Duero');

for (const province of provinces) {
  const html = fs.readFileSync(path.join(root, routeFile(province.path)), 'utf8');
  checkPresentation(html, province.path);
  const locals = localPages.filter(p => p.province === province.name);
  assert.ok(locals.length > 0, `${province.name}: sin localidades generadas`);
  for (const page of locals) assert.ok(html.includes(`href="${page.path}"`), `${province.name}: falta enlace a ${page.name}`);
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
checkPresentation(home, '/');
assert.equal((home.match(/class="province-grid"/g) || []).length, 1, 'Portada: debe tener un único bloque de provincias');
assert.ok(!/SEO local por municipio|páginas locales preparadas/.test(home), 'Portada: resumen técnico no destinado al cliente');
const zones = home.match(/<section class="section soft" id="zonas">([\s\S]*?)<\/section>/)?.[1];
assert.ok(zones, 'Portada: falta el acceso a los pueblos');
for (const province of provinces) {
  assert.equal(zones.split(`href="${province.path}"`).length - 1, 1, `Portada: acceso único a ${province.name}`);
}
assert.ok(fs.statSync(path.join(root, 'assets/logo-antenasrapid.webp')).size > 0, 'Falta el archivo de logo publicado');
console.log(`AUDITORÍA SEO LOCAL OK: ${localPages.length} páginas; ${titlePatterns.size} patrones de title, ${descriptionPatterns.size} metas, ${localBodyFingerprints.size} bloques desarrollados distintos, schema Service sin dirección inventada, Urgencias 24h, URLs históricas de Bilbao/Aranda/Lerma e interlinking provincial.`);
