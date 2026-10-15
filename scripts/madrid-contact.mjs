/** Regional contacts applied to final HTML. The historical module name is retained. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import site from '../config/site.json' with {type:'json'};
import districts from '../content/madrid-districts.json' with {type:'json'};
import {htmlFiles} from './canonical-urls.mjs';

export const MADRID_CONTACT=Object.freeze({phone:'614 78 99 45',tel:'+34614789945',whatsapp:'34614789945'});
export const NORTH_CONTACT=Object.freeze({phone:site.phone,tel:site.tel,whatsapp:site.whatsapp});
export const CENTRAL_PROVINCES=Object.freeze([
 {name:'Madrid',slug:'madrid',municipalities:179,districts:21},
 {name:'Guadalajara',slug:'guadalajara',municipalities:288,districts:0},
 {name:'Toledo',slug:'toledo',municipalities:204,districts:0}
]);
const replacements=[
 [encodeURIComponent(site.phone),encodeURIComponent(MADRID_CONTACT.phone)],
 [site.phone,MADRID_CONTACT.phone],[site.tel,MADRID_CONTACT.tel],
 [site.whatsapp,MADRID_CONTACT.whatsapp],[site.tel.slice(3),MADRID_CONTACT.tel.slice(3)]
].sort((a,b)=>b[0].length-a[0].length);
const footerPattern=/<footer\b[^>]*>[\s\S]*?<\/footer>/gi;
const cssLink='<link rel="stylesheet" href="/assets/regional-contact.css?v=20261015">';
export const isMadridPage=route=>typeof route==='string'&&/^\/?antenas-madrid(?:\/|$)/i.test(route);
export const isCentralPage=route=>typeof route==='string'&&/^\/?antenas-(?:madrid|guadalajara|toledo)(?:\/|$)/i.test(route);
export const withoutFooter=html=>html.replace(footerPattern,'');
export function replaceMadridContact(text){
 assert.equal(typeof text,'string','Contacto regional: se esperaba texto');
 return replacements.reduce((result,[from,to])=>result.replaceAll(from,to),text);
}
export function regionalFooterContacts(){
 return `<div class="regional-contacts" data-regional-contacts="madrid-guadalajara-toledo"><strong>Contacto por zonas</strong><p class="regional-contact"><strong>Madrid, Guadalajara y Toledo</strong><a class="regional-phone" href="tel:${MADRID_CONTACT.tel}" aria-label="Llamar para Madrid, Guadalajara y Toledo: ${MADRID_CONTACT.phone}">${MADRID_CONTACT.phone}</a><a class="regional-whatsapp" href="https://wa.me/${MADRID_CONTACT.whatsapp}" aria-label="WhatsApp para Madrid, Guadalajara y Toledo">WhatsApp de esta zona</a></p><p class="regional-contact"><strong>Zona norte y Castilla y León</strong><a class="regional-phone" href="tel:${NORTH_CONTACT.tel}" aria-label="Llamar para zona norte y Castilla y León: ${NORTH_CONTACT.phone}">${NORTH_CONTACT.phone}</a><a class="regional-whatsapp" href="https://wa.me/${NORTH_CONTACT.whatsapp}" aria-label="WhatsApp para zona norte y Castilla y León">WhatsApp de esta zona</a></p></div>`;
}
export function assertRegionalFooter(html,label='Página'){
 const footers=[...html.matchAll(footerPattern)];
 assert.equal(footers.length,1,`${label}: debe existir un solo pie`);
 const footer=footers[0][0],expected=regionalFooterContacts();
 assert.equal(footer.split(expected).length-1,1,`${label}: faltan los dos contactos con sus zonas exactas`);
 assert.equal((footer.match(/data-regional-contacts=/g)||[]).length,1,`${label}: bloque de contacto duplicado`);
 const rest=footer.replace(expected,'');
 for(const contact of [MADRID_CONTACT,NORTH_CONTACT])for(const value of Object.values(contact))assert.ok(!rest.includes(value),`${label}: teléfono repetido sin zona en el pie`);
 return {footerCalls:2,footerWhatsapps:2};
}
export function assertPageContact(html,central,label='Página'){
 const body=withoutFooter(html),expected=central?MADRID_CONTACT:NORTH_CONTACT;
 const forbidden=central?replacements.map(([old])=>old):[...Object.values(MADRID_CONTACT),'614789945',encodeURIComponent(MADRID_CONTACT.phone)];
 assert.ok(body.includes(expected.phone),`${label}: falta el teléfono principal de su zona`);
 for(const value of forbidden)assert.ok(!body.includes(value),`${label}: teléfono de otra zona fuera del pie: ${value}`);
 const calls=[...body.matchAll(/\bhref=["']tel:([^"']+)["']/g)].map(m=>m[1]);
 const whatsapps=[...body.matchAll(/\bhref=["']https:\/\/wa\.me\/([^?"'/]+)(?:\?[^"']*)?["']/g)].map(m=>m[1]);
 assert.ok(calls.length&&whatsapps.length,`${label}: faltan llamadas o WhatsApp fuera del pie`);
 for(const number of calls)assert.equal(number,expected.tel,`${label}: llamada principal incorrecta`);
 for(const number of whatsapps)assert.equal(number,expected.whatsapp,`${label}: WhatsApp principal incorrecto`);
 const visit=value=>{
  if(Array.isArray(value))value.forEach(visit);
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value)){
   if(key==='telephone')assert.equal(item,expected.tel,`${label}: teléfono incorrecto en datos estructurados`);
   else visit(item);
  }
 };
 for(const m of body.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))visit(JSON.parse(m[1]));
 return {calls:calls.length,whatsapps:whatsapps.length,...assertRegionalFooter(html,label)};
}
export const assertMadridContact=(html,label='Madrid')=>assertPageContact(html,true,label);
export function rewriteRegionalPage(html,route){
 const footers=[...html.matchAll(footerPattern)];
 assert.equal(footers.length,1,`${route}: pie ausente o duplicado`);
 const match=footers[0],oldFooter=match[0];
 let footer=oldFooter;
 const current=/<div class="regional-contacts" data-regional-contacts="[^"]+">[\s\S]*?<\/div>/g;
 const legacy=/<div><strong>Contacto<\/strong><p>[\s\S]*?<\/p><\/div>/g;
 const pattern=footer.includes('data-regional-contacts=')?current:legacy;
 const districtFooter='<footer class="footer"><div class="wrap"><strong>Antenas Rapid</strong><p>Servicio técnico de antenas, porteros y videoporteros. Consulta disponibilidad por localidad.</p></div></footer>';
 if(footer===districtFooter&&isMadridPage(route)){
  footer=footer.replace('</div></footer>',regionalFooterContacts()+'</div></footer>');
 }else{
  assert.equal([...footer.matchAll(pattern)].length,1,`${route}: no se reconoce el bloque de contacto`);
  footer=footer.replace(pattern,regionalFooterContacts());
 }
 // Both contacts are labelled above; remove the former unlabelled repeated phone.
 footer=footer.replace(/(<p class="fine">Antenas Rapid · Propiedad de R\.F\.G\.) · (?:641 589 394|614 78 99 45)(<\/p>)/g,'$1$2');
 let before=html.slice(0,match.index),after=html.slice(match.index+oldFooter.length);
 if(isCentralPage(route)){before=replaceMadridContact(before);after=replaceMadridContact(after);}
 if(!before.includes(cssLink)){
  assert.ok(before.includes('</head>'),`${route}: falta cierre de head`);
  before=before.replace('</head>',cssLink+'</head>');
 }
 const result=before+footer+after;
 assertPageContact(result,isCentralPage(route),route);
 return result;
}
function inventory(root){
 const manifestFile=path.join(root,'local-pages-manifest.json');
 const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 assert.equal(districts.districts.length,21,'Madrid: deben conservarse los 21 distritos');
 const routes=[],byProvince={};
 for(const province of CENTRAL_PROVINCES){
  const folder='Antenas-'+province.name,base='/'+folder+'/';
  const towns=manifest.filter(p=>p.path.toLowerCase().startsWith(base.toLowerCase()));
  assert.equal(towns.length,province.municipalities,`${province.name}: inventario municipal incompleto`);
  const expected=[base+'index.html',...towns.map(p=>p.path),...(province.districts?districts.districts.map(d=>base+d.slug+'.html'):[])];
  const actual=fs.readdirSync(path.join(root,folder),{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.html')).map(e=>base+e.name).sort();
  assert.equal(new Set(expected).size,expected.length,`${province.name}: rutas duplicadas`);
  assert.deepEqual(actual,[...expected].sort(),`${province.name}: HTML incompleto o sin inventariar`);
  routes.push(...expected);byProvince[province.slug]=expected.length;
 }
 assert.equal(routes.length,695,'Deben existir 695 páginas de Madrid, Guadalajara y Toledo');
 return {manifestFile,manifest,routes,byProvince};
}
export function auditMadridContact(root='dist'){
 const {routes,byProvince}=inventory(root),centralRoutes=new Set(routes.map(r=>r.slice(1)));
 let calls=0,whatsapps=0,otherPages=0,footerPages=0;
 for(const file of htmlFiles(root)){
  const route=path.relative(root,file).split(path.sep).join('/'),html=fs.readFileSync(file,'utf8');
  if(route==='404.html')continue;
  const central=isCentralPage(route);
  if(central)assert.ok(centralRoutes.has(route),`${route}: página central fuera del inventario`);
  const counts=assertPageContact(html,central,route);footerPages++;
  assert.equal(html.split(cssLink).length-1,1,`${route}: estilos del pie ausentes o duplicados`);
  if(central){calls+=counts.calls;whatsapps+=counts.whatsapps;}else otherPages++;
 }
 return {centralPages:routes.length,madridPages:byProvince.madrid,byProvince,municipalities:671,districts:21,calls,whatsapps,otherPages,footerPages};
}
export function applyMadridContact(root='dist'){
 const {manifestFile,manifest}=inventory(root);
 const css=fs.readFileSync(new URL('../src/regional-contact.css',import.meta.url),'utf8');
 // Validate every HTML before any write; the 404 page remains byte-for-byte intact.
 const pending=htmlFiles(root).filter(file=>path.relative(root,file)!=='404.html').map(file=>{
  const before=fs.readFileSync(file,'utf8'),route=path.relative(root,file).split(path.sep).join('/');
  return {file,before,after:rewriteRegionalPage(before,route)};
 });
 for(const {file,before,after} of pending)if(after!==before)fs.writeFileSync(file,after);
 fs.mkdirSync(path.join(root,'assets'),{recursive:true});
 fs.writeFileSync(path.join(root,'assets/regional-contact.css'),css);
 const updated=manifest.map(page=>isCentralPage(page.path)?Object.fromEntries(Object.entries(page).map(([key,value])=>[key,typeof value==='string'?replaceMadridContact(value):value])):page);
 fs.writeFileSync(manifestFile,JSON.stringify(updated,null,2));
 const report=auditMadridContact(root);
 console.log(`CONTACTO REGIONAL OK: ${report.centralPages} páginas (Madrid 201, Guadalajara 289, Toledo 205) al ${MADRID_CONTACT.phone}; ${report.footerPages} pies con ambos contactos; demás cabeceras y botones conservan ${NORTH_CONTACT.phone}.`);
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)console.log(JSON.stringify(auditMadridContact(process.env.PRODUCTION_ROOT||'dist')));
