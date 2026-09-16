import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'local-pages-manifest.json'), 'utf8'));

const checks = [
  { name: 'Navarra', route: '/Antenas-Navarra/', min: 250 },
  { name: 'La Rioja', route: '/Antenas-La-Rioja/', min: 160 }
];

for (const check of checks) {
  const provinceFile = path.join(root, check.route.slice(1), 'index.html');
  if (!fs.existsSync(provinceFile)) throw new Error(`Falta la página provincial de ${check.name}`);
  const locals = manifest.filter(p => p.province === check.name);
  if (locals.length < check.min) throw new Error(`${check.name}: solo ${locals.length} municipios generados`);
  for (const page of locals.slice(0, 5)) {
    const file = path.join(root, page.path.slice(1));
    if (!fs.existsSync(file)) throw new Error(`${check.name}: falta ${page.path}`);
  }
}

if (manifest.length < 1100) throw new Error(`Total local insuficiente tras ampliar provincias: ${manifest.length}`);
console.log(`EXTRAS OK: ${checks.map(c => `${c.name}=${manifest.filter(p => p.province === c.name).length}`).join(', ')} · total=${manifest.length}.`);
