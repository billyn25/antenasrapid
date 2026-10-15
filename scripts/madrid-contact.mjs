/** Final, server-rendered contact override. Never changes URLs or other provinces. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import site from '../config/site.json' with {type:'json'};
import districts from '../content/madrid-districts.json' with {type:'json'};

export const MADRID_CONTACT=Object.freeze({phone:'614 78 99 45',tel:'+34614789945',whatsapp:'34614789945'});
const replacements=[
 [encodeURIComponent(site.phone),encodeURIComponent(MADRID_CONTACT.phone)],
 [site.phone,MADRID_CONTACT.phone],
 [site.tel,MADRID_CONTACT.tel],
 [site.whatsapp,MADRID_CONTACT.whatsapp],
 [site.tel.slice(3),MADRID_CONTACT.tel.slice(3)]
].sort((a,b)=>b[0].length-a[0].length);

export const isMadridPage=route=>typeof route==='string'&&/^\/?antenas-madrid(?:\/|$)/i.test(route);
export function replaceMadridContact(text){
 assert.equal(typeof text,'string','Contacto Madrid: se esperaba texto');
 return replacements.reduce((result,[from,to])=>result.replaceAll(from,to),text);
}
export function assertMadridContact(html,label='Madrid'){
 assert.ok(html.includes(MADRID_CONTACT.phone),`${label}: falta teléfono visible de Madrid`);
 for(const [old] of replacements)assert.ok(!html.includes(old),`${label}: conserva el contacto antiguo ${old}`);
 const calls=[...html.matchAll(/\bhref=["']tel:([^"']+)["']/g)].map(m=>m[1]);
 const whatsapps=[...html.matchAll(/\bhref=["']https:\/\/wa\.me\/([^?"'/]+)(?:\?[^"']*)?["']/g)].map(m=>m[1]);
 assert.ok(calls.length>0&&whatsapps.length>0,`${label}: faltan enlaces de llamada o WhatsApp`);
 for(const number of calls)assert.equal(number,MADRID_CONTACT.tel,`${label}: llamada a otro número`);
 for(const number of whatsapps)assert.equal(number,MADRID_CONTACT.whatsapp,`${label}: WhatsApp a otro número`);
 const visit=value=>{
  if(Array.isArray(value))value.forEach(visit);
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){
   if(key==='telephone')assert.equal(item,MADRID_CONTACT.tel,`${label}: teléfono incorrecto en datos estructurados`);
   else visit(item);
  }
 };
 for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))visit(JSON.parse(m[1]));
 return {calls:calls.length,whatsapps:whatsapps.length};
}
function inventory(root){
 const manifestFile=path.join(root,'local-pages-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 const towns=manifest.filter(p=>isMadridPage(p.path));
 assert.equal(towns.length,179,'Madrid: deben conservarse los 179 municipios');
 assert.equal(districts.districts.length,21,'Madrid: deben conservarse los 21 distritos');
 const routes=['/Antenas-Madrid/index.html',...towns.map(p=>p.path),...districts.districts.map(d=>`/Antenas-Madrid/${d.slug}.html`)];
 assert.equal(new Set(routes).size,201,'Madrid: hay rutas duplicadas');
 const actual=fs.readdirSync(path.join(root,'Antenas-Madrid'),{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html')).map(e=>'/Antenas-Madrid/'+e.name).sort();
 assert.deepEqual(actual,[...routes].sort(),'Madrid: HTML incompleto o páginas sin inventariar');
 return {manifestFile,manifest,routes};
}
export function auditMadridContact(root='dist'){
 const {routes}=inventory(root);let calls=0,whatsapps=0,otherPages=0;
 for(const route of routes){
  const result=assertMadridContact(fs.readFileSync(path.join(root,route.slice(1)),'utf8'),route);
  calls+=result.calls;whatsapps+=result.whatsapps;
 }
 const walk=dir=>{
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const file=path.join(dir,entry.name);
   if(entry.isDirectory())walk(file);
   else if(entry.isFile()&&entry.name.endsWith('.html')){
    const rel=path.relative(root,file).split(path.sep).join('/');
    if(isMadridPage(rel))continue;
    const html=fs.readFileSync(file,'utf8');
    for(const number of Object.values(MADRID_CONTACT))assert.ok(!html.includes(number),`${rel}: contacto Madrid fuera de su provincia`);
    otherPages++;
   }
  }
 };
 walk(root);
 return {madridPages:routes.length,municipalities:179,districts:21,calls,whatsapps,otherPages};
}
export function applyMadridContact(root='dist'){
 const {manifestFile,manifest,routes}=inventory(root);
 // Validate the complete replacement in memory before writing any page.
 const pending=routes.map(route=>{
  const file=path.join(root,route.slice(1)),before=fs.readFileSync(file,'utf8'),after=replaceMadridContact(before);
  assertMadridContact(after,route);return {file,before,after};
 });
 for(const {file,before,after} of pending)if(after!==before)fs.writeFileSync(file,after);
 const updated=manifest.map(page=>isMadridPage(page.path)?Object.fromEntries(Object.entries(page).map(([key,value])=>[key,typeof value==='string'?replaceMadridContact(value):value])):page);
 const serialized=JSON.stringify(updated,null,2);
 if(fs.readFileSync(manifestFile,'utf8')!==serialized)fs.writeFileSync(manifestFile,serialized);
 const report=auditMadridContact(root);
 console.log(`CONTACTO MADRID OK: ${report.madridPages} páginas (179 municipios, 21 distritos y provincia); ${report.calls} llamadas y ${report.whatsapps} WhatsApp al ${MADRID_CONTACT.phone}; ${report.otherPages} HTML externos sin el nuevo número.`);
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 console.log(JSON.stringify(auditMadridContact(process.env.PRODUCTION_ROOT||'dist')));
}
