import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

// Only Madrid receives the homepage photograph and existing gallery.
// Reuse the same asset URLs, markup, styles and lightbox: no new downloads.
export const MADRID_VISUAL_ROUTE = '/Antenas-Madrid/';
export const isMadridVisualRoute = route => route === MADRID_VISUAL_ROUTE ||
  /^\/Antenas-Madrid\/[a-z0-9-]+\.html$/.test(route);

export function applyMadridVisuals(html, route, gallery) {
  if (!isMadridVisualRoute(route)) return html;
  if (html.includes('data-madrid-visuals="1"')) return html;
  const hero = '<section class="hero">';
  assert.equal(html.split(hero).length, 2, `${route}: hero ausente o duplicado`);
  for (const [part, id] of [['style', 'rapid-gallery-style'], ['markup', 'galeria'], ['script', 'rapid-gallery-script']]) {
    assert.ok(gallery?.[part]?.includes(`id="${id}"`), `${route}: falta ${part} de la galería de portada`);
    assert.ok(!html.includes(`id="${id}"`), `${route}: galería ya presente sin marcador`);
  }
  assert.equal(html.split('</head>').length, 2, `${route}: head inválido`);
  assert.equal(html.split('</body>').length, 2, `${route}: body inválido`);
  // Match the homepage placement: after the service content, before the towns section.
  const marker = route === MADRID_VISUAL_ROUTE
    ? '<section class="section soft" id="localidades">'
    : '<section class="section soft" id="zonas">';
  assert.equal(html.split(marker).length, 2, `${route}: destino para galería ausente o duplicado`);
  return html
    .replace(hero, '<section class="hero home-clean-hero madrid-photo-hero" data-madrid-visuals="1">')
    .replace('</head>', `${gallery.style}</head>`)
    .replace(marker, gallery.markup + marker)
    .replace('</body>', `${gallery.script}</body>`);
}


export function homepageGallery(home) {
  const patterns = {
    style: /<style id="rapid-gallery-style">[\s\S]*?<\/style>/,
    markup: /<section class="gallery-section" id="galeria">[\s\S]*?<\/section><dialog class="gallery-lightbox"[\s\S]*?<\/dialog>/,
    script: /<script id="rapid-gallery-script">[\s\S]*?<\/script>/
  };
  const gallery = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => {
    const match = home.match(pattern);
    assert.ok(match, `Falta ${key} de la galería de portada`);
    return [key, match[0]];
  }));
  assert.equal((gallery.markup.match(/class="gallery-open"/g) || []).length, 12, 'La galería de portada debe conservar sus 12 fotos');
  return gallery;
}

function main() {
  const root = path.resolve('dist');
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const gallery = homepageGallery(home);
  assert.ok(home.includes('class="hero home-clean-hero"'), 'Falta el hero aprobado en portada');
  assert.ok(fs.existsSync(path.join(root, 'assets/hero-antenasrapid-HQ.jpg')), 'Falta la foto del hero');
  const locals = JSON.parse(fs.readFileSync(path.join(root, 'local-pages-manifest.json'), 'utf8'));
  const routes = [MADRID_VISUAL_ROUTE, ...locals.filter(p => isMadridVisualRoute(p.path)).map(p => p.path)];
  assert.equal(routes.length, 180, 'Directorio y 179 municipios de Madrid');
  for (const route of routes) {
    const file = path.join(root, route.slice(1), route.endsWith('/') ? 'index.html' : '');
    const html = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, applyMadridVisuals(html, route, gallery));
  }
  console.log(`MADRID VISUAL OK: ${routes.length} páginas con la foto y las 12 imágenes de portada; otras provincias intactas.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
