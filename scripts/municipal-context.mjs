import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {localDoorphoneCases} from './local-doorphone-cases.mjs';
import snapshot from '../content/municipal-context.json' with {type:'json'};
import {canonicalPath,PRODUCTION_DOMAIN} from './canonical-urls.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(n,precision=0)=>new Intl.NumberFormat('es-ES',{useGrouping:true,minimumFractionDigits:precision,maximumFractionDigits:precision}).format(n);
export function distanceKm(a,b){
 const rad=d=>d*Math.PI/180,dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude);
 const q=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;
 return 6371.0088*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));
}
export function municipality(page){
 const record=snapshot.municipalities[page.municipioId];
 assert(record,`${page.path}: falta municipio IGN ${page.municipioId}`);
 const [officialName,population,areaKm2,capital,latitude,longitude]=record;
 assert(Number.isInteger(population)&&population>=0&&areaKm2>0);
 assert(latitude>=35&&latitude<=44&&longitude>=-10&&longitude<=5);
 return {...page,officialName,population,areaKm2,capital,latitude,longitude};
}
export function nearestTowns(page,towns,count=6){
 return towns.filter(t=>t.municipioId!==page.municipioId).map(t=>({...t,distance:distanceKm(page,t)}))
 .sort((a,b)=>a.distance-b.distance||a.municipioId.localeCompare(b.municipioId)).slice(0,count);
}
export function provinceRing(page,towns){
 const group=towns.filter(t=>t.province===page.province).sort((a,b)=>a.municipioId.localeCompare(b.municipioId));
 const index=group.findIndex(t=>t.municipioId===page.municipioId);assert(index>=0);
 return [group[(index+group.length-1)%group.length],group[(index+1)%group.length]];
}
export function contextBlock(p){
 const hasOtherCapital=p.capital!==p.officialName;
 return `<section class="section soft municipal-context" id="contexto-municipal" data-municipal-context="ign-2025-v1"><div class="wrap"><span class="eyebrow">Ubicación de la instalación</span><h2>Preparar una revisión en ${esc(p.name)}</h2><div class="municipal-layout"><div><p>${hasOtherCapital?`La referencia cartográfica municipal de la tabla del IGN es ${esc(p.capital)}. Si la instalación está en otro núcleo de ${esc(p.name)}, indica su nombre y la dirección para concretar el aviso.`:`Para revisar una antena o un portero en ${esc(p.name)}, indica la calle y el inmueble. Si se trata de una comunidad, confirma qué viviendas están afectadas y el acceso a los equipos comunes.`}</p><a href="https://signa.ign.es/signa/?center=${p.longitude},${p.latitude}&amp;level=14&amp;basemap=basemap_3" rel="noopener">Ver ${esc(p.capital)} en el mapa del IGN →</a></div><dl class="municipal-facts"><div><dt>Población de referencia</dt><dd>${number(p.population)}<small>habitantes</small></dd></div><div><dt>Superficie municipal</dt><dd>${number(p.areaKm2,2)}<small>km²</small></dd></div><div><dt>Referencia municipal</dt><dd class="municipal-capital">${esc(p.capital)}</dd></div></dl></div><p class="municipal-source">Fuente: <a href="${snapshot.sourcePage}">IGN · Información Geográfica Destacada</a>, tabla revisada el ${snapshot.revision}. Cifras de esa edición; no son una estimación de población actual. Obra derivada CC BY 4.0 ign.es, 2025.</p></div></section>`;
}
export function nearbyBlock(p,nearby,ring){
 const extra=ring.filter(t=>!nearby.some(n=>n.municipioId===t.municipioId));
 return `<section class="related-towns-section geographic-neighbors" id="pueblos-cercanos" data-geographic-neighbors="ign-2025-v1" aria-label="Localidades próximas a ${esc(p.name)}"><div class="wrap"><div class="related-towns"><span class="eyebrow">Continúa por tu zona</span><h3>Localidades próximas a ${esc(p.name)}</h3><p>Páginas de antenista en municipios próximos con información de sus servicios. Puedes consultar otra localidad si la instalación está allí.</p><div class="related-town-links">${nearby.map(t=>`<a href="${t.path}" data-nearby-ine="${t.municipioId}" data-distance-km="${t.distance.toFixed(4)}"><span>Antenista en ${esc(t.name)}</span><small>${esc(t.province)} · ${number(t.distance,1)} km aprox.</small></a>`).join('')}</div><p class="distance-note">Distancias en línea recta entre referencias municipales del IGN, no por carretera ni tiempos de desplazamiento. Se muestran localidades con página en Antenas Rapid.</p>${extra.length?`<nav class="province-neighbor-nav" aria-label="Más municipios de ${esc(p.province)}"><span>Más municipios de ${esc(p.province)}:</span>${extra.map(t=>`<a href="${t.path}" data-ring-ine="${t.municipioId}">${esc(t.name)}</a>`).join('')}</nav>`:''}</div></div></section>`;
}
export function compactMunicipalTrust(html,name){
 return html.replace(/<section class="trust section soft" id="experiencia">[\s\S]*?<\/section>/,block=>{
  const groups=[...block.matchAll(/<div class="brand-group">[\s\S]*?<div class="brand-pills">[\s\S]*?<\/div><\/div>/g)].map(m=>m[0]).join('');
  const stars=block.match(/<div class="stars"[^>]*>[\s\S]*?<\/div>/)?.[0]||'';
  return `<section class="trust section soft" id="experiencia"><div class="wrap"><span class="eyebrow">Equipos y compatibilidad</span><h2>Revisión de equipos en ${esc(name)}</h2>${stars}<p class="section-lead">Facilita la marca y el modelo visibles para estudiar la reparación o un recambio compatible con tu instalación.</p>${groups}</div></section>`;
 });
}
export function enhanceMunicipality(html,p,nearby,ring){
 if(html.includes('data-municipal-context="ign-2025-v1"'))return html;
 const metadata=html.match(/<title>[\s\S]*?<\/title>|<h1>[\s\S]*?<\/h1>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>/g);
 html=localDoorphoneCases(compactMunicipalTrust(html,p.name),p.municipioId);
 const oldContext=/<section class="section soft"><div class="wrap two-col">[\s\S]*?<\/section>/;
 assert(oldContext.test(html),`${p.path}: falta bloque de preparación`);
 const oldRelated=/<section class="related-towns-section"[\s\S]*?<\/section>/;
 assert(oldRelated.test(html),`${p.path}: falta navegación municipal`);
 html=html.replace(oldContext,contextBlock(p)).replace(oldRelated,nearbyBlock(p,nearby,ring));
 // Remove the older, non-geographic second list independently of the contact layout.
 html=html.replace(/<div class="other-localities">[\s\S]*?<\/div>/,'');
 const items=nearby.map((t,i)=>({'@type':'ListItem',position:i+1,name:`Antenista en ${t.name}`,url:PRODUCTION_DOMAIN+canonicalPath(t.path)}));
 const schema={'@context':'https://schema.org','@type':'ItemList','@id':PRODUCTION_DOMAIN+canonicalPath(p.path)+'#pueblos-cercanos',name:`Localidades próximas a ${p.name}`,itemListElement:items};
 html=html.replace('</head>',`<script id="nearby-municipalities-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);
 assert.deepEqual(html.match(/<title>[\s\S]*?<\/title>|<h1>[\s\S]*?<\/h1>|<meta name="description"[^>]*>|<link rel="canonical"[^>]*>/g),metadata);
 return html;
}
const css=`\n/* Official municipal context and real geographic navigation */\n.municipal-layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:32px;align-items:start}.municipal-layout p{line-height:1.7;color:var(--muted);margin:0 0 16px}.municipal-layout a{font-weight:700;color:var(--brand)}.municipal-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0}.municipal-facts>div{padding:20px;background:#fff;border:1px solid var(--line);border-radius:12px;min-width:0}.municipal-facts>div:last-child{grid-column:1/-1}.municipal-facts dt{font-size:12px;color:var(--muted);margin-bottom:10px}.municipal-facts dd{font-size:28px;font-weight:800;margin:0;line-height:1.2;overflow-wrap:anywhere}.municipal-facts dd small{display:block;margin-top:7px;font-size:12px;font-weight:500}.municipal-facts dd.municipal-capital{font-size:20px}.municipal-source{font-size:12px;line-height:1.6;color:var(--muted);margin-top:20px}.geographic-neighbors .related-town-links{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.geographic-neighbors .related-town-links a{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:14px;min-width:0;overflow-wrap:anywhere}.related-town-links small{display:block;font-size:11px;font-weight:500;line-height:1.5;color:var(--muted);margin-top:5px}.related-towns .distance-note{margin:16px 0 0;font-size:11px;line-height:1.6}.province-neighbor-nav{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:16px;font-size:12px}.province-neighbor-nav a{font-weight:700;text-decoration:underline}.geographic-neighbors{padding-bottom:20px}@media(max-width:760px){.municipal-layout{grid-template-columns:1fr;gap:20px}.geographic-neighbors .related-town-links{grid-template-columns:repeat(2,minmax(0,1fr))}.municipal-facts>div{padding:16px}.municipal-facts dd{font-size:24px}}@media(max-width:400px){.geographic-neighbors .related-town-links{grid-template-columns:1fr}}\n`;
export function applyMunicipalContext(root='dist'){
 const towns=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).map(municipality);
 assert.equal(towns.length,3797);
 for(const p of towns){
  const file=path.join(root,p.path.slice(1));
  fs.writeFileSync(file,enhanceMunicipality(fs.readFileSync(file,'utf8'),p,nearestTowns(p,towns),provinceRing(p,towns)));
 }
 fs.appendFileSync(path.join(root,'assets/site.css'),css);
 console.log(`CONTEXTO MUNICIPAL OK: ${towns.length} fichas IGN, seis enlaces por proximidad y recorrido provincial completo.`);
}
export function auditMunicipalContext(root='dist'){
 const towns=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).map(municipality);
 const byId=new Map(towns.map(t=>[t.municipioId,t]));const inbound=new Map(towns.map(t=>[t.municipioId,new Set()]));
 for(const p of towns){
  const html=fs.readFileSync(path.join(root,p.path.slice(1)),'utf8');
  assert.equal((html.match(/id="contexto-municipal"/g)||[]).length,1,p.path);
  assert.equal((html.match(/id="pueblos-cercanos"/g)||[]).length,1,p.path);
  assert(!html.includes('class="other-localities"'),p.path);
  const actual=[...html.matchAll(/data-nearby-ine="(\d+)" data-distance-km="([\d.]+)"/g)];
  const expected=nearestTowns(p,towns);assert.equal(actual.length,6,p.path);
  assert.deepEqual(actual.map(m=>m[1]),expected.map(t=>t.municipioId),p.path);
  const links=[...actual.map(m=>m[1]),...[...html.matchAll(/data-ring-ine="(\d+)"/g)].map(m=>m[1])];
  assert(links.every(id=>id!==p.municipioId&&byId.has(id)),p.path);
  for(const id of links)inbound.get(id).add(p.municipioId);
  for(const m of actual)assert(Math.abs(Number(m[2])-distanceKm(p,byId.get(m[1])))<0.0001);
  assert(html.includes(number(p.population))&&html.includes(number(p.areaKm2,2)),p.path);
  assert(html.includes(snapshot.revision)&&html.includes('CC BY 4.0'),p.path);
  for(const link of [...expected,...provinceRing(p,towns)])assert(html.includes(`href="${canonicalPath(link.path)}"`),p.path);
 }
 const min=Math.min(...[...inbound.values()].map(s=>s.size));assert(min>=2,`Municipio con pocos enlaces entrantes: ${min}`);
 console.log(`AUDITORÍA GEOGRÁFICA OK: ${towns.length} municipios, 22782 enlaces por distancia verificada, mínimo ${min} municipios enlazando cada ficha y ninguna ruta desconocida.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 if(process.argv.includes('--audit'))auditMunicipalContext();else applyMunicipalContext();
}
