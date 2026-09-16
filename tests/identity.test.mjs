import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pages, site, renderPage, esc } from '../scripts/build.mjs';
import { SERVICE_STATEMENT, localMetadata, locationLabel } from '../scripts/identity.mjs';

test('frase aprobada íntegra y visible, en description y datos estructurados', () => {
  for (const p of pages) {
    const html = renderPage(p), meta = localMetadata(p, site);
    assert.equal(SERVICE_STATEMENT, 'Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros');
    assert.ok(html.includes(`<p class="service-statement">${SERVICE_STATEMENT}</p>`));
    assert.ok(meta.description.includes(SERVICE_STATEMENT));
    assert.ok(meta.description.indexOf(site.phone) < meta.description.indexOf(SERVICE_STATEMENT));
    assert.ok(html.includes(`<meta name="description" content="${esc(meta.description)}">`));
    assert.ok(html.includes(`<meta property="og:description" content="${esc(meta.description)}">`));
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    assert.ok(graph.some(n => n.description === meta.description));
  }
});
test('página local: pueblo y provincia juntos, teléfono temprano y servicios en descripción', () => {
  for (const p of pages.filter(p => p.type === 'town')) {
    const meta = localMetadata(p, site), html = renderPage(p);
    assert.equal(meta.title, `Antenista en ${locationLabel(p)} | ${site.phone}`);
    assert.ok(meta.description.includes('porteros automáticos y videoporteros'));
    assert.ok(html.includes(`<h1>Antenista en ${esc(locationLabel(p))}</h1>`));
    assert.ok(html.includes(`Porteros automáticos y videoporteros en ${p.name}</h2>`));
  }
});
test('porteros y videoporteros: menú, sección y fichas separadas', () => {
  for (const p of pages) {
    const html = renderPage(p);
    for (const id of ['porteros-videoporteros','porteros','videoporteros']) assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
    assert.ok(html.includes('href="#porteros-videoporteros"'));
    assert.ok(html.includes('<h3>Porteros automáticos</h3>'));
    assert.ok(html.includes('<h3>Videoporteros</h3>'));
  }
});
test('las dieciocho rutas base permanecen, sin generar clones nuevos', () => {
  assert.deepEqual(pages.map(p => p.path), ['/', '/Antenas-Alava/', '/Antenas-Bizkaia/', '/Antenas-Burgos/', '/Antenas-Cantabria/', '/Antenas-Guipuzcoa/', '/Antenas-Navarra/', '/Antenas-La-Rioja/', '/Antenas-Leon/', '/Antenas-Valladolid/', '/Antenas-Zamora/', '/Antenas-Avila/', '/Antenas-Palencia/', '/Antenas-Salamanca/', '/Antenas-Segovia/', '/Antenas-Soria/', '/Antenas-Bizkaia/bilbao.html', '/Antenas-Burgos/lerma.html']);
});
test('identidad grafito y rojo, sin la ilustración ni estilos azules anteriores', () => {
  const css = fs.readFileSync('src/site.css', 'utf8');
  assert.ok(css.includes('--brand:#b62435'));
  assert.ok(css.includes('--deep:#222327'));
  assert.ok(!/hero-art|#103c69|#edab24|#ff8700/i.test(css));
  assert.ok(!renderPage(pages[0]).includes('hero-art'));
});
test('una localidad de nombre largo nunca pierde la frase ni el teléfono', () => {
  const p = {type:'town',name:'Villarcayo de Merindad de Castilla la Vieja',title:'Prueba',heading:'Prueba'};
  const m = localMetadata(p, site);
  assert.ok(m.description.includes(p.name));
  assert.ok(m.description.includes(site.phone));
  assert.ok(m.description.endsWith(SERVICE_STATEMENT + '.'));
});
