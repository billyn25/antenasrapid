import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMadridVisuals, isMadridVisualRoute} from '../scripts/madrid-visuals.mjs';
const gallery = {
  style: '<style id="rapid-gallery-style">.gallery-grid{display:grid}</style>',
  markup: '<section class="gallery-section" id="galeria"><img src="/assets/galeria/trabajo-01.jpg" loading="lazy"></section><dialog id="gallery-lightbox"></dialog>',
  script: '<script id="rapid-gallery-script">/* same as homepage */</script>'
};
const page = kind => `<html><head><title>Madrid local | 641 589 394</title><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://www.antenasrapid.com/Antenas-Madrid/"></head><body><section class="hero"><h1>Antenista en Madrid</h1><a href="tel:+34641589394">641 589 394</a></section><section class="section soft" id="${kind}"><a href="/Antenas-Madrid/alcala-de-henares.html">Alcalá de Henares</a></section><section id="preguntas"></section></body></html>`;

test('solo Madrid y sus páginas municipales, sin alcanzar portada ni otras provincias', () => {
  for(const route of ['/', '/Antenas-Burgos/', '/Antenas-Burgos/lerma.html', '/Antenas-Madrid-extra/', '/Antenas-Madrid/../lerma.html']) {
    assert.equal(isMadridVisualRoute(route), false);
    assert.equal(applyMadridVisuals(page('zonas'), route, null), page('zonas'));
  }
});
test('mismo hero y galería de portada en el directorio y el municipio; conserva títulos, H1, contactos y enlaces', () => {
  for (const [route, kind] of [['/Antenas-Madrid/', 'localidades'], ['/Antenas-Madrid/madrid.html', 'zonas']]) {
    const html=page(kind), updated=applyMadridVisuals(html, route, gallery);
    assert.ok(updated.includes('class="hero home-clean-hero madrid-photo-hero"'));
    assert.ok(updated.includes(gallery.markup));
    assert.ok(updated.indexOf(gallery.markup) < updated.indexOf(`id="${kind}"`));
    assert.equal(updated.match(/<h1>[\s\S]*?<\/h1>/)[0], html.match(/<h1>[\s\S]*?<\/h1>/)[0]);
    assert.equal(updated.replace(gallery.style,'').match(/<head>[\s\S]*?<\/head>/)[0], html.match(/<head>[\s\S]*?<\/head>/)[0]);
    assert.deepEqual([...updated.matchAll(/href="([^"]+)"/g)].map(x=>x[1]), [...html.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));
    assert.ok(updated.includes('id="preguntas"'));
  }
});
test('una sola galería y lightbox aunque se aplique dos veces', () => {
  const once=applyMadridVisuals(page('zonas'), '/Antenas-Madrid/madrid.html', gallery);
  assert.equal(applyMadridVisuals(once, '/Antenas-Madrid/madrid.html', gallery), once);
  for(const id of ['galeria','gallery-lightbox','rapid-gallery-style','rapid-gallery-script']) assert.equal(once.split(`id="${id}"`).length,2);
});
test('falla ante estructura incompleta en vez de omitir el cambio o duplicar secciones', () => {
  assert.throws(()=>applyMadridVisuals(page('zonas'), '/Antenas-Madrid/', gallery), /destino/);
  assert.throws(()=>applyMadridVisuals(page('localidades').replace('class="hero"','class="otro"'), '/Antenas-Madrid/', gallery), /hero/);
  assert.throws(()=>applyMadridVisuals(page('localidades'), '/Antenas-Madrid/', {}), /galería/);
});
