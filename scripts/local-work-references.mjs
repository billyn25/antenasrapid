import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { distanceKm, municipality } from './municipal-context.mjs';
import work from '../content/trabajos-reales.json' with { type: 'json' };
import madrid from '../content/madrid-districts.json' with { type: 'json' };

const provinces = new Set(['/Antenas-Bizkaia/', '/Antenas-Madrid/']);
const madridCapital = '/Antenas-Madrid/madrid.html';
const style = '<style>.local-work-references{margin-top:24px;padding:18px 20px;border:1px solid var(--line);border-radius:12px}.local-work-references h3{margin:0 0 8px;font-size:1.05rem}.local-work-references ul{margin:0;padding-left:20px}.local-work-references li+li{margin-top:8px}.local-work-references a{text-decoration:underline;text-underline-offset:3px}</style>';
const escape = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function applyLocalWorkReferences(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'local-pages-manifest.json'), 'utf8'));
  const towns = manifest.filter(page => provinces.has(page.path.replace(/[^/]+$/, ''))).map(municipality);
  const townByRoute = new Map(towns.map(town => [town.path, town]));
  const casesByTown = new Map();
  for (const photo of work.localPhotos) {
    if (!townByRoute.has(photo.townPath) || casesByTown.has(photo.townPath)) continue;
    casesByTown.set(photo.townPath, { ...townByRoute.get(photo.townPath), photo });
  }

  function caseLink(example, local) {
    const { photo, name, path } = example;
    return `<li><a href="${local ? '' : escape(path)}#galeria">${escape(photo.title ?? photo.alt)}${photo.title ? '' : ' · ' + escape(name)}</a></li>`;
  }

  const districts = madrid.districts.map(district => ({
    path: `/Antenas-Madrid/${district.slug}.html`,
    province: 'Madrid',
    district: true,
  }));
  for (const town of [...towns, ...districts]) {
    const file = join(root, town.path.slice(1));
    const html = readFileSync(file, 'utf8');
    if (html.includes('data-zone-work="1"')) continue;
    const own = casesByTown.get(town.path);
    const nearby = town.district ? [casesByTown.get(madridCapital)] : [...casesByTown.values()]
      .filter(example => example.province === town.province && example.path !== town.path)
      .map(example => ({ example, distance: distanceKm(town, example) }))
      .sort((a, b) => a.distance - b.distance || a.example.path.localeCompare(b.example.path))
      .slice(0, 2).map(({ example }) => example);

    assert.ok(nearby.length && nearby.every(Boolean), town.path + ': faltan trabajos documentados');
    const heading = own ? 'Trabajos documentados y ejemplos de la zona' : town.district ? 'Trabajo documentado en Madrid capital' : 'Trabajos documentados en otros municipios de la zona';
    const links = (own ? caseLink(own, true) : '') + nearby.map(example => caseLink(example, false)).join('');
    const block = `<aside data-zone-work="1" class="local-work-references"><h3>${heading}</h3><ul>${links}</ul></aside>`;
    const services = /(<section\b[^>]*id="servicios"[^>]*>[\s\S]*?)(<\/section>)/;
    assert.match(html, services, town.path);
    const updated = html.replace(services, (_, body, close) => body + block + close);
    writeFileSync(file, updated.replace('</head>', style + '</head>'));
  }
  console.log(`TRABAJOS POR ZONA OK: ${towns.length} municipios de Bizkaia y Madrid y ${districts.length} distritos.`);
}
