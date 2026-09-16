import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pages, site, esc, renderPage } from '../scripts/build.mjs';
import { localMetadata, SERVICE_STATEMENT } from '../scripts/identity.mjs';
import { brandMark } from '../scripts/logo.mjs';

const header = html => html.match(/<header>([\s\S]*?)<\/header>/)[1];

test('cabecera: una imagen de marca y ningún nombre tipográfico duplicado', () => {
  for (const page of pages) {
    const h = header(renderPage(page));
    assert.equal((h.match(/<img\b/g) || []).length, 1);
    assert.ok(!/wordmark|<em>RAPID<\/em>/.test(h));
    assert.equal((h.match(/class="brand-tagline"/g) || []).length, 1);
    assert.ok(h.includes('Antenas · Porteros · Videoporteros'));
    assert.ok(h.includes(`href="tel:${site.tel}"`));
  }
});

test('logo: tamaño real y recurso existente, sin estilos que oculten hermanos', () => {
  const h = brandMark();
  assert.ok(h.includes('width="384" height="128"'));
  assert.ok(h.includes('src="/assets/logo-antenasrapid.webp"'));
  assert.ok(h.includes('alt="Antenas Rapid"'));
  assert.ok(!/<style|display:none|:has\(/.test(h));
  const image = Buffer.from(fs.readFileSync('src/logo-antenasrapid-clean.webp.b64', 'utf8').trim(), 'base64');
  assert.equal(image.toString('ascii', 0, 4), 'RIFF');
  assert.equal(image.toString('ascii', 8, 12), 'WEBP');
});

test('contraste: antena oscura aclarada sin borrar alfa ni invertir rojo/blanco', () => {
  const h = brandMark();
  const matrix = h.match(/values="([^"]+)"/)[1].split(/\s+/).map(Number);
  assert.equal(matrix.length, 20);
  assert.deepEqual(matrix.slice(15), [0, 0, 0, 1, 0]);
  const apply = p => [0,1,2,3].map(i => matrix.slice(i*5, i*5+4).reduce((sum,v,j) => sum+v*p[j], matrix[i*5+4]));
  const dark = apply([0.10,0.12,0.14,1]);
  assert.ok(dark.slice(0,3).every(c => c > .65));
  assert.ok(apply([1,1,1,1]).every(c => Math.abs(c-1)<.001));
  const red = apply([.8,.04,.12,1]);
  assert.ok(red[0]>.75 && red[1]<.1 && red[2]<.2);
  assert.ok(fs.readFileSync('src/site.css','utf8').includes('filter:url(#rapid-logo-contrast)'));
});

test('hero: tres enlaces útiles y sus destinos reales, sin nuevas páginas vacías', () => {
  for (const page of pages) {
    const html = renderPage(page);
    const desk = html.match(/<aside class="service-desk"[\s\S]*?<\/aside>/)[0];
    assert.equal((desk.match(/class="desk-service"/g)||[]).length, 3);
    for (const id of ['servicios','porteros-videoporteros','cobertura-movil']) {
      assert.ok(desk.includes(`href="#${id}"`));
      assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
    }
    assert.ok(html.includes('<div class="hero-tags">'));
    assert.equal((html.match(/<section class="hero">/g)||[]).length,1);
  }
});

test('SEO: mismos títulos, H1, descripción, canonical y frase aprobada', () => {
  for (const page of pages) {
    const html = renderPage(page), meta = localMetadata(page, site);
    assert.ok(html.includes(`<title>${esc(meta.title)}</title>`));
    assert.ok(html.includes(`<h1>${esc(meta.heading)}</h1>`));
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.ok(html.includes(`<meta name="description" content="${esc(meta.description)}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${new URL(page.path, site.domain).href}">`));
    assert.ok(html.includes(`<p class="service-statement">${SERVICE_STATEMENT}</p>`));
    assert.ok(html.includes('noindex,nofollow'));
  }
});

test('sin dependencia de scripts en la marca ni nuevo bloque duplicado de provincias', () => {
  assert.ok(!/<script/.test(brandMark()));
  const html = renderPage(pages.find(p=>p.type==='home'));
  assert.equal((html.match(/class="province-grid"/g)||[]).length,1);
  assert.ok(!html.includes('id="paginas-locales"'));
});

test('no se inventan reseñas, sedes o tiempos en el hero', () => {
  for (const page of pages) {
    const html = renderPage(page);
    const hero = html.match(/<section class="hero">[\s\S]*?<\/section>/)[0];
    assert.ok(!/AggregateRating|ratingValue|30 minutos|45 minutos|sede en/i.test(hero));
    if (!page.urgentLabel) assert.ok(!/24\s*h/i.test(hero));
  }
});
