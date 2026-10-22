import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {technicalBlock} from './technical-services.mjs';

// Consolidate repeated explanations; do not invent municipal faults or hide copy.
const release='20261022-v2';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export function replaceSection(html,id,transform){
 const token=new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>`).exec(html);
 if(!token)return html;
 const tags=/<\/?section\b[^>]*>/g;tags.lastIndex=token.index;let depth=0,end;
 for(let m;(m=tags.exec(html));){depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=tags.lastIndex;break;}}
 assert(end,`Sección sin cerrar: ${id}`);
 return html.slice(0,token.index)+transform(html.slice(token.index,end))+html.slice(end);
}
const coverage=[
 ['El router recibe bien fuera, pero no dentro','Antes de elegir antena exterior, identifica el modelo del router, sus conectores y las bandas que admite. La longitud del coaxial también introduce pérdidas; una antena incompatible puede empeorar el resultado.'],
 ['Internet llega al router y se pierde en las habitaciones','Si la conexión funciona por cable y falla lejos del router, se estudia la red interior: puntos de acceso, cableado o malla. Una antena móvil exterior no corrige por sí sola esa falta de wifi.'],
 ['Datos móviles lentos a ciertas horas','Compara la conexión en el mismo equipo y lugar en distintos momentos. La velocidad puede depender de la red y su carga; ganar señal no garantiza resolver una limitación de capacidad del operador.'],
 ['Preparar una conexión 4G/5G para una vivienda','Anota operador, modelo del router y lugar donde recibe mejor. Se valora recepción exterior y reparto interior por separado, con el paso de cable y la alimentación previstos antes del montaje.'],
 ['Llamadas y conexión a internet son consultas distintas','Indica si se cortan las llamadas del teléfono o los datos del router. Las antenas para un router no mejoran automáticamente las llamadas; cualquier repetición de señal necesita comprobar autorización y condiciones del operador.'],
 ['Conexión para varias plantas','Se compara la conexión junto al router con la de cada planta para decidir el recorrido de red. Un enlace por cable hasta otro punto de acceso puede evitar depender de una cadena de repetidores wifi.'],
 ['La conexión cambia al mover el router','Una ventana puede ofrecer mejor recepción que una habitación interior. Se comprueba estabilidad, compatibilidad de antenas y recorrido del cable antes de fijar el equipo en una ubicación definitiva.'],
 ['Renovar la red sin confundir fibra, wifi y cobertura móvil','Conviene identificar dónde empieza la pérdida de conexión. Se separa el acceso a internet de la distribución dentro de casa para presupuestar únicamente el tramo que necesita atención.']
];
function reduceReusedGuides(html,key){
 // The main catalogue already exposes all services. This second six-item
 // local menu repeated it without adding information about the installation.
 html=replaceSection(html,'servicio-local',()=> '');
 html=html.replace('<section class="section wrap local-service-depth"','<section id="orientacion-provincial" class="section wrap local-service-depth"');
 return replaceSection(html,'orientacion-provincial',block=>block.replace(/<details id="revision-([^"]+)" class="local-depth-card">([\s\S]*?)<\/details>/g,(_,id,body)=>{
  const ps=[...body.matchAll(/<p><strong>[\s\S]*?<\/p>/g)].map(m=>m[0]);
  if(ps.length<2)return `<details id="revision-${id}" class="local-depth-card">${body}</details>`;
  const selected=hash(key+':province-guide:'+id)%ps.length;let n=0;
  body=body.replace(/<p><strong>[\s\S]*?<\/p>/g,()=>n++===selected?ps[selected]:'');
  return `<details id="revision-${id}" class="local-depth-card">${body}</details>`;
 }).replace(/<h3>Qué concretar en el presupuesto<\/h3><p>[\s\S]*?<\/p>/,'<p>Concreta desplazamiento, diagnóstico, materiales y comprobación final antes de aceptar la intervención.</p>'));
}
export function reduceTown(html,page){
 if(html.includes(`data-editorial-consolidation="${release}"`))return html;
 if(html.includes('data-editorial-consolidation="20261022"'))return reduceReusedGuides(html,page.municipioId||page.path).replace('data-editorial-consolidation="20261022"',`data-editorial-consolidation="${release}"`);
 const metadata=html.match(/<title>[\s\S]*?<\/title>|<h1[^>]*>[\s\S]*?<\/h1>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>/g);
 const images=html.match(/<img\b[^>]*>/g)||[];
 const key=page.municipioId||page.path;
 // Keep every service and every photograph visible, but expand different work
 // on each page instead of repeating the complete catalogue on every town.
 html=replaceSection(html,'servicios',block=>{
  const cards=[...block.matchAll(/<article class="service-card" id="([^"]+)"[^>]*>[\s\S]*?<\/article>/g)];
  const expanded=new Set(cards.map(m=>({id:m[1],rank:hash(key+':catalogue:'+m[1])})).sort((a,b)=>a.rank-b.rank).slice(0,3).map(x=>x.id));
  return block.replace(/<article class="service-card" id="([^"]+)"[^>]*>[\s\S]*?<\/article>/g,(card,id)=>expanded.has(id)?card:card.replace(/<p>[\s\S]*?<\/p>/g,''));
 });
 // The three work types remain reachable; develop one instead of repeating all three twice.
 html=replaceSection(html,'porteros-videoporteros',block=>{
  const work=block.match(/<div class="doorphone-work">([\s\S]*?)<\/div>/);
  if(!work)return block;
  const articles=[...work[1].matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
  if(articles.length<2)return block;
  const selected=articles[hash(key+':access')%articles.length];
  block=block.replace(work[0],`<div class="doorphone-work editorial-single-work">${selected}</div>`);
  block=block.replace(/<p class="doorphone-note">[\s\S]*?<\/p>/,'');
  return block;
 });
 html=replaceSection(html,'cobertura-movil',()=>{
  const [heading,text]=coverage[hash(key+':network')%coverage.length];
  return `<section class="mobile-coverage section" id="cobertura-movil"><div class="wrap"><span class="eyebrow">Conectividad en ${esc(page.name)}</span><h2>${esc(heading)}</h2><p class="section-lead">${esc(text)}</p><a href="#contacto" data-contact-service="cobertura-movil-servicio">Consultar mi instalación →</a></div></section>`;
 });
 html=replaceSection(html,'experiencia',block=>{
  // Retain requested stars and manufacturer names as a concise reference, not a second sales section.
  const brands=[...block.matchAll(/<span>(Televés|Alcad|Ikusi|Fagor|Rover|EK|FTE Maximal|Fringe|Fermax|Tegui|Golmar|Comelit|BTicino|Legrand|Galak)<\/span>/g)].map(m=>m[1]);
  const unique=[...new Set(brands)];const start=hash(key+':brands')%Math.max(1,unique.length);
  const chosen=[...unique.slice(start),...unique.slice(0,start)].slice(0,4);
  const stars=block.match(/<div class="stars"[^>]*>[\s\S]*?<\/div>/)?.[0]||'';
  return `<section class="trust section soft" id="experiencia"><div class="wrap"><h2>Identificar el material antes del recambio</h2>${stars}<p>La referencia y el sistema instalado determinan la compatibilidad. ${chosen.length?`Entre los fabricantes que trabajamos: ${chosen.map(esc).join(', ')}.`:''}</p></div></section>`;
 });
 // The technical block already covers these generic local-intent summaries. Keep the
 // section and its anchors as a compact navigation aid, rather than duplicate paragraphs.
 html=replaceSection(html,'servicio-local',block=>block.replace(/<article([^>]*)>([\s\S]*?)<\/article>/g,(_,attrs,body)=>{
  const heading=body.match(/<h3>[\s\S]*?<\/h3>/)?.[0]||'';
  return `<article${attrs}>${heading}<a href="#contacto">Consultar este trabajo →</a></article>`;
 }).replace(/<p class="section-lead">[\s\S]*?<\/p>/,'').replace(/<div class="local-faq">[\s\S]*?<\/div>/,''));
 html=reduceReusedGuides(html,key);
 html=html.replace('<main id="contenido"',`<main data-editorial-consolidation="${release}" id="contenido"`);
 assert.deepEqual(html.match(/<title>[\s\S]*?<\/title>|<h1[^>]*>[\s\S]*?<\/h1>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>/g),metadata,`${page.path}: metadatos`);
 assert.deepEqual(html.match(/<img\b[^>]*>/g)||[],images,`${page.path}: fotografías`);
 return html;
}
export function apply(root='dist'){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 for(const page of manifest){const file=path.join(root,page.path.slice(1));fs.writeFileSync(file,reduceTown(fs.readFileSync(file,'utf8'),page));}
 const districts=JSON.parse(fs.readFileSync('content/madrid-districts.json','utf8')).districts;
 for(const district of districts){
  const file=path.join(root,'Antenas-Madrid',district.slug+'.html');let html=fs.readFileSync(file,'utf8');
  if(html.includes(`data-editorial-consolidation="${release}"`))continue;
  if(html.includes('data-editorial-consolidation="20261022"')){fs.writeFileSync(file,html.replace('data-editorial-consolidation="20261022"',`data-editorial-consolidation="${release}"`));continue;}
  // Districts previously repeated the same six paragraphs. Keep that service
  // navigation and develop selected, different installation questions instead.
  html=replaceSection(html,'servicios',block=>block.replace(/<article([^>]*)>([\s\S]*?)<\/article>/g,(_,attrs,body)=>`<article${attrs}>${body.replace(/<p>[\s\S]*?<\/p>/,'')}<a href="#contacto">Consultar este servicio →</a></article>`));
  const marker='<section class="section wrap faq">';assert(html.includes(marker),district.slug+': preguntas');
  html=html.replace(marker,technicalBlock(district.name,'district:'+district.slug)+marker);
  html=html.replace('<main id="contenido"',`<main data-editorial-consolidation="${release}" id="contenido"`);
  fs.writeFileSync(file,html);
 }
 fs.appendFileSync(path.join(root,'assets/site.css'),'\n.editorial-single-work{grid-template-columns:1fr!important;max-width:900px}.editorial-single-work article{border-left:0!important}.mobile-coverage>.wrap>.section-lead{max-width:920px}\n');
 console.log(`CONSOLIDACIÓN EDITORIAL OK: ${manifest.length} pueblos y ${districts.length} distritos; metadatos, fotos, servicios y contacto conservados.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)apply();
