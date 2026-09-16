import fs from 'node:fs';

const file = 'content/pages.json';
const pages = JSON.parse(fs.readFileSync(file, 'utf8'));

const extras = [
  {
    type: 'province',
    path: '/Antenas-Navarra/',
    name: 'Navarra',
    title: 'Antenistas en Navarra · Porteros automáticos y videoporteros | 641 589 394',
    heading: 'Antenas y porteros en Navarra',
    lead: 'Servicio de antenas TDT, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil. Indica tu municipio para preparar el aviso.',
    intro: 'Antenas Rapid organiza el servicio en Navarra por municipio. Para orientar una reparación conviene indicar si el problema afecta a una vivienda, una comunidad o un negocio y qué parte de la instalación falla.',
    focus: 'Preparar el aviso en Navarra',
    advice: 'Indica tu municipio, el tipo de inmueble y si el fallo afecta a una sola toma o a varios puntos. Para porteros, señala si falla llamada, audio, imagen o apertura.',
    towns: [],
    source: 'dataset-municipal-publico',
    evidence: 'generated-province-preview'
  },
  {
    type: 'province',
    path: '/Antenas-La-Rioja/',
    name: 'La Rioja',
    title: 'Antenistas en La Rioja · Porteros automáticos y videoporteros | 641 589 394',
    heading: 'Antenas y porteros en La Rioja',
    lead: 'Reparación e instalación de antenas, TDT, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil. Indica tu localidad al contactar.',
    intro: 'Antenas Rapid organiza el servicio en La Rioja por municipio. Antes de sustituir equipos se revisa la instalación para diferenciar problemas de recepción, amplificación, cableado, distribución o acceso.',
    focus: 'Revisar antes de sustituir',
    advice: 'Describe el síntoma, la localidad y si ocurre en una sola vivienda o en varias. No es necesario desmontar equipos ni acceder a cubiertas para facilitar esos datos.',
    towns: [],
    source: 'dataset-municipal-publico',
    evidence: 'generated-province-preview'
  }
];

let changed = false;
for (const extra of extras) {
  if (!pages.some(p => p.path === extra.path)) {
    const firstTown = pages.findIndex(p => p.type === 'town');
    if (firstTown === -1) pages.push(extra);
    else pages.splice(firstTown, 0, extra);
    changed = true;
  }
}

if (changed) fs.writeFileSync(file, JSON.stringify(pages, null, 2) + '\n');
console.log(`PROVINCIAS PREPARADAS: ${extras.map(x => x.name).join(' + ')}.`);
