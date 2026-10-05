import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pages, renderPage, site } from '../scripts/build.mjs';

test('Asturias y Soria tienen un solo directorio y conservan los servicios de Rapid', () => {
  for (const name of ['Asturias', 'Soria']) {
    const matches = pages.filter(p => p.path === `/Antenas-${name}/`);
    assert.equal(matches.length, 1, `${name}: directorio ausente o duplicado`);
    assert.equal(matches[0].type, 'province');
    const html = renderPage(matches[0]);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(html.includes(name) && html.includes(site.phone));
    for (const id of ['servicios', 'porteros', 'videoporteros', 'localidades', 'preguntas']) {
      assert.ok(html.includes(`id="${id}"`), `${name}: falta ${id}`);
    }
    assert.ok(html.includes('TDT por satélite HD'), `${name}: falta TDT-SAT`);
  }
});

test('el inventario y la auditoría incluyen Asturias y conservan Soria, sin datos postales inventados', () => {
  const source = fs.readFileSync('scripts/fetch-municipalities.mjs', 'utf8');
  const audit = fs.readFileSync('scripts/audit-extra-provinces.mjs', 'utf8');
  assert.match(source, /'33':\s*\{ name: 'Asturias', path: '\/Antenas-Asturias\/' \}/);
  assert.match(source, /'42':\s*\{ name: 'Soria', path: '\/Antenas-Soria\/' \}/);
  for (const name of ['Asturias', 'Soria']) assert.ok(audit.includes(`route: '/Antenas-${name}/'`));
  assert.equal(JSON.parse(fs.readFileSync('content/postal-codes-madrid.json', 'utf8')).provinceId, '28');
});
