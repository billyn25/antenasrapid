import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceFile=new URL('../content/bizkaia-geography.json',import.meta.url);
export function validateGeography(data){
 assert.equal(data.municipalities.length,113);
 assert.equal(new Set(data.municipalities.map(m=>m.id)).size,113);
 for(const m of data.municipalities){
  assert.match(m.id,/^48\d{3}$/);assert(m.name&&m.postalCodes.length&&m.streets.length,m.name);
  for(const cp of m.postalCodes)assert.match(cp,/^48\d{3}$/);
  for(const key of ['postalCodes','streets','areas','neighborhoods'])assert.equal(new Set(m[key]).size,m[key].length,m.name+': '+key);
 }
 return data;
}
export function geographyBlock(page,row,data){
 const areas=row.neighborhoods.length?row.neighborhoods:row.areas;
 const label=row.neighborhoods.length?'Barrios de referencia':'Núcleos y entidades de población';
 const names=values=>values.map(esc).join(' · ');
 const areaBlock=areas.length?`<div><h3>${label}</h3><p>${names(areas.slice(0,8))}.</p>${areas.length>8?`<details><summary>Ver las ${areas.length} zonas de referencia</summary><p>${names(areas)}.</p></details>`:''}</div>`:'';
 return `<section class="section soft bizkaia-geography" id="codigos-postales" data-bizkaia-geography="20261024"><div class="wrap"><span class="eyebrow">Localiza tu instalación</span><h2>Calles, zonas y códigos postales de ${esc(page.name)}</h2><p>Al consultar una reparación de antena, portero o videoportero en ${esc(page.name)}, indica calle, número de portal y código postal. En una instalación compartida, señala también si afecta a una vivienda o a varios vecinos.</p><div class="bizkaia-geography-grid"><div><h3>Códigos postales</h3><p class="bizkaia-postal-codes">${names(row.postalCodes)}</p><p>Son códigos asociados a direcciones del municipio en CartoCiudad. Un código puede compartirse entre municipios; confirma el de tu portal.</p></div>${areaBlock}</div><div class="bizkaia-streets"><h3>Calles y vías de referencia</h3><p>${names(row.streets.slice(0,12))}.</p><p>Esta selección orienta la ubicación del aviso; no es un callejero completo. Los códigos anteriores corresponden al municipio, no a cada vía de esta lista: pueden cambiar según el tramo y número.</p></div><p class="geography-source">Fuentes: <a href="https://www.cartociudad.es/web/portal/directorio-de-servicios/descarga">CartoCiudad · IGN/CNIG</a> (direcciones y códigos; obra derivada CC BY 4.0 · SCNE); <a href="https://www.eustat.eus/elementos/xls0011438_c.csv">Eustat · entidades de población, referencia 01/01/2025</a>${row.neighborhoods.length?'; <a href="https://www.eustat.eus/elementos/tbl0013711_c.html">Eustat · barrios, referencia 01/01/2025</a>':''}. Datos consultados el ${esc(data.checkedOn)}. Las zonas sirven para ubicar la consulta y no representan oficinas ni trabajos realizados.</p><a href="#contacto">Preparar un aviso en ${esc(page.name)} →</a></div></section>`;
}
export function localVisibleCopy(html){
 // Preserve attributes, URLs, structured data and styles; only edit visible text nodes.
 return html.replace(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>)|([^<]+)/gi,(all,tag,text)=>{
  if(tag){
   if(/^<meta\b/i.test(tag)&&/(?:name|property)="(?:description|og:description|og:title|twitter:title|twitter:description)"/i.test(tag)){
    const cleaned=tag.replace(/, Bizkaia/g,'').replace(/ en Bizkaia/g,'');
    if(/(?:name|property)="(?:description|og:description|twitter:description)"/i.test(cleaned))return cleaned.replace(/content="([^"]*)"/,(_,value)=>`content="${value.length<115&&!value.includes(' Consulta tu instalación.')?value+' Consulta tu instalación.':value}"`);
    return cleaned;
   }
   return tag;
  }
  return text.replace(/, Bizkaia/g,'').replace(/Bizkaia · /g,'').replace(/en Bizkaia/g,'en la provincia').replace(/de Bizkaia/g,'de la provincia').replace(/Bizkaia/g,'Localidades');
 });
}
export function applyBizkaiaGeography(root='dist'){
 const data=validateGeography(JSON.parse(fs.readFileSync(sourceFile,'utf8'))),byId=new Map(data.municipalities.map(m=>[m.id,m]));
 const pages=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).filter(p=>p.province==='Bizkaia');assert.equal(pages.length,113);
 for(const p of pages){
  const row=byId.get(p.municipioId);assert(row,p.path);
  const file=path.join(root,p.path.slice(1));let html=fs.readFileSync(file,'utf8');
  assert(!html.includes('id="codigos-postales"'),p.path+': bloque duplicado');
  const marker='<section class="section wrap faq" id="preguntas">';assert(html.includes(marker),p.path);
  html=html.replace(marker,geographyBlock(p,row,data)+marker).replace('</head>','<link rel="stylesheet" href="/assets/bizkaia-geography.css?v=20261024"></head>');
  fs.writeFileSync(file,localVisibleCopy(html));
 }
 const dir=path.join(root,'Antenas-Bizkaia/index.html');let html=fs.readFileSync(dir,'utf8');
 for(const p of pages){const row=byId.get(p.municipioId);const marker=`data-town="${esc(p.name)}"`;assert(html.includes(marker),p.path+': directorio');html=html.replace(marker,`data-town="${esc(p.name+' '+row.postalCodes.join(' ')+' '+row.neighborhoods.join(' ')+' '+row.areas.join(' '))}"`);}
 html=html.replace('Buscar localidad</label>','Buscar municipio, zona o código postal</label>').replace('Escribe el nombre de tu localidad','Ej.: Barakaldo o 48901');fs.writeFileSync(dir,html);
 fs.writeFileSync(path.join(root,'assets/bizkaia-geography.css'),'.bizkaia-geography-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;margin-top:24px}.bizkaia-geography details{margin-top:16px}.bizkaia-geography summary{cursor:pointer;min-height:44px}.bizkaia-geography .bizkaia-postal-codes{font-weight:700;letter-spacing:.04em}.bizkaia-streets{margin-top:24px}.bizkaia-geography .geography-source{font-size:12px!important;line-height:1.65;color:var(--muted)}@media(max-width:720px){.bizkaia-geography-grid{grid-template-columns:1fr;gap:18px}}');
 console.log(`GEOGRAFÍA BIZKAIA OK: ${pages.length} municipios con códigos, vías y zonas verificadas; directorio por municipio, zona y CP.`);
}
export function cleanBizkaiaCopy(root='dist'){
 const pages=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).filter(p=>p.province==='Bizkaia');
 assert.equal(pages.length,113);
 for(const p of pages){const file=path.join(root,p.path.slice(1));fs.writeFileSync(file,localVisibleCopy(fs.readFileSync(file,'utf8')));}
 console.log('TEXTO LOCAL OK: 113 fichas centradas en el municipio, rutas y datos internos conservados.');
}
export function auditBizkaiaGeography(root='dist'){
 const data=validateGeography(JSON.parse(fs.readFileSync(sourceFile,'utf8'))),byId=new Map(data.municipalities.map(m=>[m.id,m]));
 const pages=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).filter(p=>p.province==='Bizkaia');assert.equal(pages.length,113);
 for(const p of pages){
  const h=fs.readFileSync(path.join(root,p.path.slice(1)),'utf8'),row=byId.get(p.municipioId);
  assert.equal((h.match(/id="codigos-postales"/g)||[]).length,1,p.path);
  const block=h.match(/<section[^>]*data-bizkaia-geography=[\s\S]*?<\/section>/)?.[0];assert(block,p.path);
  for(const cp of row.postalCodes)assert(block.includes(cp),p.path+': '+cp);
  const visible=h.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,'');
  assert(!visible.includes('Bizkaia'),p.path+': provincia visible');
  for(const meta of h.matchAll(/<meta[^>]*(?:name|property)="(?:description|og:description|og:title)"[^>]*>/g))assert(!meta[0].includes('Bizkaia'),p.path+': metadatos');
 }
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(home.includes('data-town-finder'));
 const search=JSON.parse(fs.readFileSync(path.join(root,'assets/town-finder-index.json'),'utf8'));assert.equal(search.length,3797);assert.equal(new Set(search.map(p=>p.url)).size,3797);
 console.log('AUDITORÍA COBERTURA OK: 113 bloques postales, SEO municipal sin provincia y 3797 destinos del buscador.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 if(process.argv.includes('--audit'))auditBizkaiaGeography();else if(process.argv.includes('--copy-only'))cleanBizkaiaCopy();else applyBizkaiaGeography();
}
