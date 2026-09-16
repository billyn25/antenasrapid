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
  },
  {
    type: 'province',
    path: '/Antenas-Leon/',
    name: 'León',
    title: 'Antenistas en León · Porteros automáticos y videoporteros | 641 589 394',
    heading: 'Antenas y porteros en León',
    lead: 'Servicio de antenas TDT, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil en los municipios de León.',
    intro: 'Antenas Rapid organiza el servicio en León por municipio. Para preparar una revisión conviene indicar si se trata de una vivienda, comunidad o negocio y si el problema afecta a una toma, a varios televisores o a una instalación común.',
    focus: 'Preparar una revisión en León',
    advice: 'Indica municipio, tipo de inmueble y síntoma observado. Si el problema es de televisión, comenta si falla una toma o varias; si es de portero, distingue llamada, audio, imagen y apertura.',
    towns: [],
    source: 'dataset-municipal-publico',
    evidence: 'generated-province-preview'
  },
  {
    type: 'province',
    path: '/Antenas-Valladolid/',
    name: 'Valladolid',
    title: 'Antenistas en Valladolid · Porteros automáticos y videoporteros | 641 589 394',
    heading: 'Antenas y porteros en Valladolid',
    lead: 'Instalación y reparación de antenas, TDT, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil por municipio.',
    intro: 'Antenas Rapid organiza la atención en Valladolid por localidad. Antes de proponer cambios de equipos se revisa si la incidencia está en recepción, amplificación, distribución, cableado o en el sistema de acceso.',
    focus: 'Localizar la avería antes de cambiar equipos',
    advice: 'Indica tu municipio y qué ocurre exactamente. Si afecta a varios televisores o a varias viviendas, comunícalo al preparar el aviso porque orienta la revisión hacia la instalación común.',
    towns: [],
    source: 'dataset-municipal-publico',
    evidence: 'generated-province-preview'
  },
  {
    type: 'province',
    path: '/Antenas-Zamora/',
    name: 'Zamora',
    title: 'Antenistas en Zamora · Porteros automáticos y videoporteros | 641 589 394',
    heading: 'Antenas y porteros en Zamora',
    lead: 'Servicio técnico para antenas TDT, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil en los municipios de Zamora.',
    intro: 'Antenas Rapid organiza los avisos de Zamora por municipio. Para orientar bien una reparación conviene diferenciar una pérdida de señal, un problema de amplificación, una instalación nueva o una avería de portero.',
    focus: 'Datos útiles antes de llamar',
    advice: 'Indica localidad, tipo de inmueble y si el fallo aparece en una sola toma o en varias. Para una parabólica o un portero, facilita también si la instalación funcionaba anteriormente.',
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
