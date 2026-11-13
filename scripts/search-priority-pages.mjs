import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Pages selected from the November 2026 Search Console export.
const pages = [
  {
    path: 'Antenas-Madrid/madrid.html',
    title: 'Antenista en Madrid | Reparación de TDT y antenas colectivas',
    description: 'Reparación e instalación de antenas TDT en Madrid capital. Revisamos cabeceras de comunidades, amplificadores y pérdida de señal. Llama al 614 78 99 45.',
    section: 'servicios',
    lead: 'Reparamos antenas TDT, parabólicas y sistemas colectivos en Madrid capital. Si varias viviendas pierden los mismos canales, <a href="#antenas-colectivas-madrid">consulta cómo orientamos la revisión de la antena comunitaria</a>.',
  },
  {
    path: 'Antenas-Bizkaia/bilbao.html',
    title: 'Antenista en Bilbao | Reparación de TDT y antenas colectivas',
    description: 'Antenista en Bilbao para averías de TDT, parabólicas y antenas colectivas. Revisamos cabeceras y amplificadores. Llama al 641 589 394.',
    section: 'servicios',
    lead: 'Atendemos averías de antena en viviendas y comunidades de Bilbao. Si el corte de TDT afecta a varios vecinos, revisamos la alimentación, la central y la distribución común. En <a href="/Antenas-Bizkaia/barakaldo.html#galeria">una comunidad de Barakaldo sustituimos una central Triax por una Rover Digineo</a> tras perder la señal.',
  },
  {
    path: 'Antenas-Salamanca/index.html',
    title: 'Antenistas en Salamanca | Antenas TDT y videoporteros',
    description: 'Instalación y reparación de antenas TDT y videoporteros en Salamanca. Revisamos pérdidas de señal, centrales programables y porteros de comunidades.',
    section: 'servicios',
    lead: 'Si se corta la TDT en varias viviendas a la vez, conviene revisar primero la cabecera comunitaria. En Salamanca sustituimos una central programable que había dejado de dar señal. <a href="#galeria">Ver el trabajo con la central Rover Digineo</a>.',
  },
  {
    path: 'Antenas-Asturias/oviedo.html',
    title: 'Antenista en Oviedo | Reparación TDT y videoporteros',
    description: 'Antenista en Oviedo para averías de TDT, antenas colectivas y parabólicas. Instalación y reparación de porteros y videoporteros. Llama al 641 589 394.',
    section: 'porteros-videoporteros',
    lead: 'Si el videoportero llama pero no da imagen, dinos si también les ocurre a otros vecinos. Una avería en un solo piso puede requerir revisar su monitor o derivación. Si afecta a varios pisos, conviene comprobar la placa y la instalación común antes de valorar un recambio. <a href="#galeria">Ver una instalación en la calle Francisco Grande Covián</a>.',
  },
  {
    path: 'Antenas-Madrid/galapagar.html',
    title: 'Antenista urgente en Galapagar | Reparación TDT 24 h',
    description: '¿Te has quedado sin señal de TV en Galapagar? Atención 24 h para averías de antena TDT, parabólica y amplificador. Llama al 614 78 99 45.',
    section: 'servicios',
    lead: 'Si te has quedado sin señal de TV en Galapagar, indica al llamar si ocurre en una sola toma, en todos los televisores o también en otras viviendas. Si se ve la imagen a ratos, anota qué canales fallan. <a href="tel:+34614789945">Llamar para una avería urgente</a>.',
  },
];

export function applySearchPriorityPages(root) {
  for (const page of pages) {
    const file = join(root, page.path);
    let html = readFileSync(file, 'utf8');
    const section = new RegExp(`(<section\\b[^>]*id="${page.section}"[^>]*>[\\s\\S]*?<p class="section-lead">)[\\s\\S]*?(</p>)`);
    assert.match(html, section, page.path);
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${page.description}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${page.title}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${page.description}$2`)
      .replace(section, (_, start, end) => start + page.lead + end);
    assert.ok(html.includes(page.title) && html.includes(page.description), page.path);
    writeFileSync(file, html);
  }
}
