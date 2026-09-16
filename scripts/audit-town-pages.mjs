import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import pages from '../content/pages.json' with { type: 'json' };
import site from '../config/site.json' with { type: 'json' };
import { routeFile } from './build.mjs';

const root = path.resolve('dist');
const manifestPath = path.join(root, 'local-pages-manifest.json');
assert.ok(fs.existsSync(manifestPath), 'Falta local-pages-manifest.json');
const localPages = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const provinces = pages.filter(p => p.type === 'province');
assert.ok(localPages.length >= 700, `Expansión incompleta: solo ${localPages.length} páginas locales`);

const paths = new Set();
const titles = new Set();
const descriptions = new Set();
for (const page of localPages) {
  assert.ok(!paths.has(page.path), `Ruta local duplicada: ${page.path}`);
  paths.add(page.path);
  const file = path.join(root, routeFile(page.path));
  assert.ok(fs.existsSync(file), `Falta HTML local: ${page.path}`);
  const html = fs.readFileSync(file, 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${page.path}: debe tener un H1`);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/, `${page.path}: noindex de preview`);
  assert.ok(html.includes(`href="${new URL(page.path, site.domain).href}"`), `${page.path}: canonical propio`);
  assert.ok(html.includes(`Antenista en ${page.name}`), `${page.path}: intención antenista + pueblo`);
  assert.ok(html.includes(`Servicio en ${page.name} · ${site.phone}`), `${page.path}: servicio + pueblo + teléfono`);
  assert.ok(html.includes(`Reparación de antenas en ${page.name}`), `${page.path}: reparación + pueblo`);
  assert.ok(html.includes(`Porteros automáticos y videoporteros en ${page.name}`), `${page.path}: porteros + pueblo`);
  assert.ok(html.includes(`Cobertura móvil 4G/5G en vivienda individual en ${page.name}`), `${page.path}: cobertura móvil + pueblo`);
  assert.ok(html.includes('data-local-variant='), `${page.path}: variante local`);
  assert.ok(html.includes(site.phone), `${page.path}: teléfono`);
  assert.ok(!/AggregateRating|Review/.test(html), `${page.path}: no inventar reseñas estructuradas`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1];
  assert.ok(title && !titles.has(title), `${page.path}: título duplicado`);
  assert.ok(description && !descriptions.has(description), `${page.path}: meta description duplicada`);
  titles.add(title);
  descriptions.add(description);
}

for (const province of provinces) {
  const html = fs.readFileSync(path.join(root, routeFile(province.path)), 'utf8');
  const locals = localPages.filter(p => p.province === province.name);
  assert.ok(locals.length > 0, `${province.name}: sin localidades generadas`);
  for (const page of locals) assert.ok(html.includes(`href="${page.path}"`), `${province.name}: falta enlace a ${page.name}`);
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(home.includes(`${localPages.length} páginas locales preparadas`), 'Portada: falta el resumen visible de páginas locales');
console.log(`AUDITORÍA SEO LOCAL OK: ${localPages.length} páginas, títulos/metas únicos, canonical propio, pueblo + servicios + teléfono e interlinking provincial.`);
