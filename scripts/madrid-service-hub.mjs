import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const rootRoute='/Antenas-Madrid/';
const guides=[
 {id:'guia-reparacion-antenas',title:'Reparación de antenas TDT',symptom:'La imagen se pixela, faltan canales o desaparece la señal.',check:'Conviene distinguir si falla un solo televisor, una toma, toda la vivienda o varias viviendas. La revisión técnica puede incluir medida de señal, conectores, alimentación, antena y distribución.',decision:'No siempre es necesario sustituir la antena: una conexión deteriorada, una fuente o un tramo de cable pueden explicar el fallo.'},
 {id:'guia-antenas-colectivas',title:'Antenas colectivas y cabeceras de comunidad',symptom:'Varios vecinos pierden canales o tienen cortes a la vez.',check:'Es útil comunicar qué plantas o viviendas están afectadas y si el problema comenzó después de un cambio de equipos. Se revisan cabecera, alimentación, distribución y elementos de paso, según la instalación.',decision:'La actuación sobre elementos comunes debe coordinarse con la comunidad; una avería individual no justifica modificar toda la cabecera.'},
 {id:'guia-amplificacion',title:'Amplificadores, fuentes y distribución',symptom:'Unas tomas reciben bien y otras no, o aparecen cortes tras instalar un amplificador.',check:'Se comprueban niveles de señal y posibles pérdidas, saturación, alimentación y conexiones. Añadir ganancia sin medir puede empeorar la recepción.',decision:'La solución puede estar en un derivador, una fuente, el cableado o el ajuste de la instalación, no necesariamente en comprar otro amplificador.'},
 {id:'guia-parabolicas',title:'Parabólicas y recepción por satélite',symptom:'El receptor deja de encontrar canales o la recepción falla con frecuencia.',check:'Se diferencia el fallo de orientación, LNB, cable, conectores y configuración del receptor. También importa si la incidencia afecta a una o varias salidas.',decision:'No se debe acceder a tejados ni intentar ajustar soportes en altura sin medidas de seguridad.'},
 {id:'guia-porteros',title:'Reparación de porteros automáticos',symptom:'El telefonillo no suena, no se escucha o no acciona la apertura.',check:'Describe si falla la llamada, el audio o el abrepuertas, y si afecta a un piso o a varios. Placa, alimentación, cableado y terminal tienen funciones distintas.',decision:'Antes de cambiar un telefonillo se comprueba la compatibilidad con la instalación y, si procede, con el sistema comunitario.'},
 {id:'guia-videoporteros',title:'Instalación y averías de videoporteros',symptom:'El monitor no muestra imagen, falla el audio o no abre la puerta.',check:'Indica si se trata de una instalación nueva o una sustitución y la marca/modelo visible. Se verifica compatibilidad de placa, monitor, alimentación y cableado.',decision:'No todos los monitores funcionan con cualquier placa: elegir un equipo sin comprobar el sistema puede obligar a repetir el trabajo.'}
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp='data-madrid-service-hub="1"';
const casesAnchor = 'reparaciones-reales-madrid';
const casesLink = `<a href="${rootRoute}#${casesAnchor}">Ver trabajos de antenas, porteros y accesos en Madrid →</a>`;
const documentedCases = [
 {route: 'torrejon-de-ardoz', title: 'Apertura con llaveros en Torrejón de Ardoz', summary: 'Se añadió un lector Golmar y se conservó la placa Fermax del portal.'},
 {route: 'colmenarejo', title: 'Pérdida de TDT tras la lluvia en Colmenarejo', summary: 'Se sustituyeron las antenas UHF y el cableado tras atender el aviso en 48 horas.'},
 {route: 'madrid', title: 'Reparación de videoportero en la calle Segovia', summary: 'Intervención urgente en un Fermax DUOX en Madrid capital.'},
 {route: 'san-fernando-de-henares', title: 'Portero de dos hilos en San Fernando de Henares', summary: 'Se sustituyó una placa de cinco hilos por un sistema de dos hilos.'}
];
const repairPhotos = [
 {file: 'madrid-portero-tegui-placa.jpg', width: 738, height: 1196,
  title: 'Portero Tegui con pulsadores por vivienda',
  caption: 'Placa de calle Tegui con dos filas verticales de pulsadores y etiquetas del primero al cuarto piso.'},
 {file: 'madrid-portero-tegui-visera.jpg', width: 1536, height: 2048,
  title: 'Portero Tegui con visera metálica',
  caption: 'Placa Tegui protegida por una visera, con pulsadores para las viviendas del bajo al tercer piso.'}
];

function renderMadridCases() {
 const cards = repairPhotos.map(photo => {
  const url = `/assets/galeria/${photo.file}`;
  return `<article class="madrid-guide-card"><h3>${esc(photo.title)}</h3>
    <figure class="madrid-repair-photo">
      <a href="${url}" aria-label="Ver foto ampliada: ${esc(photo.title)}"><img src="${url}" alt="${esc(photo.title)} en un portal de Madrid" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"></a>
      <figcaption>${esc(photo.caption)}</figcaption>
    </figure></article>`;
 }).join('');
 const cases = documentedCases.map(({route,title,summary}) =>
  `<article class="madrid-guide-card"><h3>${esc(title)}</h3><p>${esc(summary)}</p><a href="${rootRoute}${route}.html#galeria">Ver trabajo y foto →</a></article>`
 ).join('');
 return `<section class="section wrap" id="${casesAnchor}" aria-labelledby="madrid-repair-title">
  <span class="eyebrow">Trabajos reales</span>
  <h2 id="madrid-repair-title">Trabajos reales en Madrid y su Comunidad</h2>
  <div class="madrid-service-hub-grid">${cases}</div>
  <h3>Reparaciones de porteros Tegui en Madrid</h3>
  <div class="madrid-service-hub-grid">${cards}</div>
  <p><a href="#contacto">Consultar una reparación en Madrid →</a></p>
 </section><style>
 #${casesAnchor}{scroll-margin-top:100px}
 .madrid-repair-photo{margin:0}
 .madrid-repair-photo a{display:block;padding:0;margin-bottom:12px;background:#eceae6;border-radius:8px;overflow:hidden}
 .madrid-repair-photo img{display:block;width:100%;height:clamp(260px,45vw,430px);object-fit:contain}
 .madrid-repair-photo figcaption{line-height:1.6}
 </style>`;
}

export function applyServiceHub(root='dist'){
 const dir=path.join(root,'Antenas-Madrid'),index=path.join(dir,'index.html');
 const assets = path.join(root, 'assets', 'galeria');
 fs.mkdirSync(assets, {recursive: true});
 for (const {file} of repairPhotos) {
  fs.copyFileSync(new URL('../src/trabajos-reales/' + file, import.meta.url), path.join(assets, file));
 }

 let html=fs.readFileSync(index,'utf8');
 if(!html.includes(stamp)){
  const cards=guides.map(g=>'<article class="madrid-guide-card" id="'+g.id+'"><h3>'+esc(g.title)+'</h3><p><strong>Situación habitual:</strong> '+esc(g.symptom)+'</p><p><strong>Qué se revisa:</strong> '+esc(g.check)+'</p><p><strong>Qué conviene saber:</strong> '+esc(g.decision)+'</p><a href="#localidades">Consultar los municipios de Madrid →</a></article>').join('');
  const section='<section class="section wrap madrid-service-hub" '+stamp+'><span class="eyebrow">Guías técnicas de servicio</span><h2>Reparación e instalación de antenas y porteros en la Comunidad de Madrid</h2><p>Información para distinguir síntomas, preparar una consulta y comprender qué se comprueba antes de decidir una reparación. No son intervenciones atribuidas a una localidad concreta.</p><div class="madrid-service-hub-grid">'+cards+'</div></section><style>.madrid-service-hub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:20px 0}.madrid-guide-card{min-width:0;padding:22px;border:1px solid #d7dce2;border-radius:12px;background:#fff}.madrid-guide-card h3{font-size:21px;line-height:1.3;margin:0 0 14px}.madrid-guide-card p{line-height:1.65}.madrid-guide-card a{display:inline-block;padding:12px 0;min-height:44px;font-weight:700}@media(max-width:720px){.madrid-service-hub-grid{grid-template-columns:1fr}}</style>';
  assert(html.includes('<section class="section wrap faq"'),'Directorio Madrid: falta ubicación de guías');
  html=html.replace('<section class="section wrap faq"',section+'<section class="section wrap faq"');
 }
 if (!html.includes(`id="${casesAnchor}"`)) {
  const marker = '<section class="section wrap faq"';
  assert.ok(html.includes(marker), 'Directorio Madrid: falta ubicación de los casos reales');
  html = html.replace(marker, () => renderMadridCases() + marker);
 }
 const doorphones = /(<section\b[^>]*id="porteros-videoporteros"[^>]*>[\s\S]*?<p class="section-lead">[\s\S]*?<\/p>)([\s\S]*?<\/section>)/;
 assert.match(html, doorphones, 'Directorio Madrid: falta el bloque de porteros');
 html = html.replace(doorphones, (block, lead, rest) => {
  if (block.includes(`#${casesAnchor}`)) return block;
  return lead + '<p>' + casesLink.replace(rootRoute, '') + '</p>' + rest;
 });
 fs.writeFileSync(index, html);

 let linked=0;
 for(const name of fs.readdirSync(dir)){
  if(!name.endsWith('.html')||name==='index.html')continue;
  const file=path.join(dir,name);let h=fs.readFileSync(file,'utf8');
  if(!h.includes('data-madrid-service-links="1"')){
   const links='<nav class="madrid-service-links" data-madrid-service-links="1" aria-label="Guías técnicas de Madrid"><h2>Guías para preparar una reparación</h2><p>Consulta qué se revisa según el tipo de avería antes de pedir presupuesto.</p><div>'+guides.map(g=>'<a href="'+rootRoute+'#'+g.id+'">'+esc(g.title)+' →</a>').join('')+'</div></nav><style>.madrid-service-links{margin:26px auto;padding:20px;border:1px solid #d7dce2;border-radius:12px;max-width:1120px}.madrid-service-links h2{font-size:23px;margin:0 0 10px}.madrid-service-links div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 16px}.madrid-service-links a{display:block;padding:12px 0;min-height:44px;font-weight:700}@media(max-width:650px){.madrid-service-links div{grid-template-columns:1fr}}</style>';
   assert(h.includes('<section class="section wrap faq"'),name+': no se encuentra FAQ');
   h=h.replace('<section class="section wrap faq"',links+'<section class="section wrap faq"');
   fs.writeFileSync(file,h);
  }
  if (['madrid.html', 'centro.html', 'san-sebastian-de-los-reyes.html'].includes(name) && !h.includes(`#${casesAnchor}`)) {
   const marker = 'aria-label="Guías técnicas de Madrid">';
   assert.ok(h.includes(marker), name + ': falta navegación para los casos reales');
   h = h.replace(marker, () => marker + '<p>' + casesLink + '</p>');
   fs.writeFileSync(file, h);
  }
  if (name === 'madrid.html' && !h.includes('id="antenas-colectivas-madrid"')) {
   const collective = `<article class="madrid-guide-card" id="antenas-colectivas-madrid"><h3>Reparación de antenas colectivas en Madrid capital</h3><p>Si varios vecinos pierden los mismos canales, indica qué viviendas o plantas están afectadas. Así podemos orientar la revisión hacia la cabecera, el amplificador o la distribución común. Si falla una sola toma, la revisión empieza en esa vivienda.</p><p><a href="${rootRoute}colmenarejo.html#galeria">Ver un caso de pérdida de TDT tras la lluvia en Colmenarejo</a></p></article>`;
   const marker = /(<section\b[^>]*id="problemas-tdt"[^>]*>[\s\S]*?)(<\/section>)/;
   assert.match(h, marker, 'Madrid capital: falta el apartado de TDT');
   h = h.replace(marker, (_, section, close) => section + collective + close);
   fs.writeFileSync(file,h);
  }
  if (name === 'centro.html' && !h.includes('id="urgencias-tdt-centro"')) {
   const urgent = `<article class="madrid-guide-card" id="urgencias-tdt-centro"><h3>Aviso urgente por pérdida de TDT en Madrid Centro</h3><p>Si la televisión se ha quedado sin señal, comprueba si ocurre en otro televisor o también les pasa a los vecinos. Al dar el aviso, indica la calle, cuándo empezó el fallo y si afecta a todos los canales. Con esos datos podemos orientar la revisión hacia una toma, el cableado de la vivienda o la instalación colectiva.</p><p><a href="#contacto">Consultar disponibilidad en el distrito Centro</a></p></article>`;
   const marker = /(<section\b[^>]*id="problemas-tdt"[^>]*>[\s\S]*?)(<\/section>)/;
   assert.match(h, marker, 'Madrid Centro: falta el apartado de TDT');
   h = h.replace(marker, (_, section, close) => section + urgent + close);
   fs.writeFileSync(file,h);
  }
  assert(h.includes('data-madrid-service-links="1"'),name+': sin navegación técnica');linked++;
 }
 assert.equal(linked,200,'Deben existir 179 municipios y 21 distritos');
 const final=fs.readFileSync(index,'utf8');
 for(const g of guides)assert(final.includes('id="'+g.id+'"'),'Falta destino '+g.id);
 assert(final.includes(stamp));
 console.log('MADRID GUÍAS OK: seis guías desarrolladas en directorio, enlaces en '+linked+' fichas, rutas originales conservadas.');
 return linked;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyServiceHub();
