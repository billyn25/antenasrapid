import fs from 'node:fs';
import path from 'node:path';
import {renderHomeContact} from './home-contact.mjs';
import {renderTvReception} from './tv-reception.mjs';

const ROOT=path.resolve('dist');
const site=JSON.parse(fs.readFileSync('config/site.json','utf8'));
const data=JSON.parse(fs.readFileSync('content/madrid-districts.json','utf8'));
const provinces=JSON.parse(fs.readFileSync('content/pages.json','utf8')).filter(page=>page.type==='province');
const contactServices=JSON.parse(fs.readFileSync('content/services.json','utf8'));
const PROVINCE_ROUTE='/Antenas-Madrid/';
const CITY_ROUTE='/Antenas-Madrid/madrid.html';

const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routeFor=d=>`${PROVINCE_ROUTE}${d.slug}.html`;
const tel=()=>`tel:${site.tel}`;
const wa=(d)=>`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(`Hola, necesito consultar un servicio de antenas en ${d.name}, Madrid.`)}`;
const stable=s=>[...s].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,5381);

const intros=[
 d=>`Servicio de antenista en el distrito de ${d.name}, Madrid, para averías de TDT, antenas colectivas e individuales, parabólicas, amplificación y distribución de señal.`,
 d=>`Consulta instalación y reparación de antenas en ${d.name}, Madrid capital. Revisamos recepción, amplificación, cableado y tomas antes de sustituir equipos.`,
 d=>`Atención técnica de antenas en ${d.name}, Madrid, para viviendas y comunidades: falta de señal, pixelaciones, parabólicas, porteros automáticos y videoporteros.`,
 d=>`Antenista en ${d.name}, distrito de Madrid, para instalación, mantenimiento y reparación de antenas TDT, parabólicas, porteros y videoporteros.`
];
const practical=[
 d=>`Si la avería está en ${d.name}, indica calle, tipo de inmueble y si el fallo afecta a una sola vivienda o a varios vecinos. Esa información ayuda a orientar la revisión.`,
 d=>`Para preparar un aviso en ${d.name}, cuéntanos si faltan todos los canales, si hay cortes intermitentes o si el problema aparece también en otras tomas de la vivienda o comunidad.`,
 d=>`En ${d.name} conviene distinguir entre una avería de recepción y un problema de distribución interior. No hace falta subir al tejado ni desmontar equipos para solicitar la revisión.`,
 d=>`Si necesitas asistencia en ${d.name}, describe el síntoma y la instalación existente. Para porteros y videoporteros indica si falla llamada, audio, imagen o apertura.`
];

function districtLinks(current){
 const list=data.districts.filter(d=>d.slug!==current.slug);
 const start=stable(current.slug)%list.length;
 return [...list.slice(start),...list.slice(0,start)].slice(0,6)
  .map(d=>`<a href="${routeFor(d)}">Antenista en ${esc(d.name)}</a>`).join('');
}
function allDistrictLinks(){
 return data.districts.map(d=>`<a href="${routeFor(d)}">Antenista en ${esc(d.name)}</a>`).join('');
}
function districtCards(){
 return data.districts.map(d=>`<a class="province-card madrid-district-card" href="${routeFor(d)}"><strong>${esc(d.name)}</strong><span>Antenista · TDT · Porteros · Videoporteros</span><span class="arrow" aria-hidden="true">→</span></a>`).join('');
}
function schema(d,canonical,desc){
 return JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':canonical+'#page',url:canonical,name:`Antenista en ${d.name}, Madrid`,description:desc},
  {'@type':'Service','@id':canonical+'#service',name:`Instalación y reparación de antenas en ${d.name}, Madrid`,url:canonical,telephone:site.tel,areaServed:{'@type':'AdministrativeArea',name:`${d.name}, Madrid`}},
  {'@type':'BreadcrumbList',itemListElement:[
   {'@type':'ListItem',position:1,name:'Inicio',item:site.domain+'/'},
   {'@type':'ListItem',position:2,name:'Madrid',item:site.domain+PROVINCE_ROUTE},
   {'@type':'ListItem',position:3,name:d.name,item:canonical}
  ]}
 ]}).replace(/</g,'\\u003c');
}
function page(d){
 const canonical=site.domain+routeFor(d);
 const alias=d.alias?` (también buscado como ${d.alias})`:'';
 const intro=intros[stable(d.slug)%intros.length](d);
 const prep=practical[Math.floor(stable(d.slug)/7)%practical.length](d);
 const desc=`Antenista en ${d.name}, Madrid. ${site.phone}. Reparación e instalación de antenas TDT, parabólicas, porteros y videoporteros.`;
 const related=districtLinks(d);
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Antenista en ${esc(d.name)}, Madrid | ${esc(site.phone)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="Antenista en ${esc(d.name)}, Madrid | ${esc(site.phone)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:site_name" content="${esc(site.brand)}"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="icon" type="image/x-icon" href="/favicon.ico"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js?v=recepcion-tdt-20261022" defer></script><script type="application/ld+json">${schema(d,canonical,desc)}</script></head><body><a class="skip" href="#contenido">Saltar al contenido</a><header><div class="wrap head"><a class="brand" href="/" aria-label="Antenas Rapid, inicio"><span><strong>ANTENAS RAPID</strong><small class="brand-tagline">Antenas · Porteros · Videoporteros</small></span></a><nav aria-label="Navegación principal"><a href="/#servicios">Antenas</a><a href="/#porteros-videoporteros">Porteros</a><a href="${PROVINCE_ROUTE}#localidades">Madrid</a><a href="#distritos-madrid">Distritos</a><a href="#contacto">Contacto</a></nav><div class="contact-top"><a href="${tel()}">${esc(site.phone)}</a><small>Consulta tu instalación</small></div></div></header><main id="contenido" data-district-page="madrid"><nav class="breadcrumbs wrap" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>›</span><a href="${PROVINCE_ROUTE}">Madrid</a><span>›</span><span>${esc(d.name)}</span></nav><section class="hero"><div class="wrap hero-inner"><div class="hero-copy"><span class="eyebrow">MADRID CAPITAL · DISTRITO DE ${esc(d.name).toUpperCase()}</span><h1>Antenista en ${esc(d.name)}, Madrid</h1><p class="service-statement">Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros</p><p class="lead">${esc(intro)}${esc(alias)}</p><a class="hero-contact-link" href="#contacto">Preparar mi consulta <span aria-hidden="true">→</span></a><p class="micro">Esta página identifica el distrito de Madrid capital; no representa una oficina o sede física.</p></div></div></section><div class="strip"><div class="wrap"><span>Antenas TDT y colectivas</span><span>Parabólicas y amplificación</span><span>Porteros y videoporteros</span><span>Cobertura móvil 4G/5G</span></div></div><section class="section wrap"><span class="eyebrow">SERVICIO TÉCNICO EN ${esc(d.name).toUpperCase()}</span><h2>Reparación e instalación de antenas en ${esc(d.name)}</h2><p class="section-lead">${esc(prep)}</p><div class="local-intents"><article><h3>Antenas TDT en ${esc(d.name)}</h3><p>Instalación, orientación y reparación de antenas TDT. Revisamos señal, cableado, repartidores y tomas cuando faltan canales o aparecen pixelaciones.</p></article><article><h3>Antenas colectivas y amplificación</h3><p>Diagnóstico de cabeceras, amplificadores, fuentes y distribución en comunidades antes de sustituir elementos de la instalación.</p></article><article><h3>Parabólicas y TDT por satélite HD</h3><p>Instalación y ajuste de parabólicas, LNB, cableado y receptores compatibles para recepción por satélite.</p></article><article><h3>Porteros automáticos y videoporteros</h3><p>Reparación, renovación e instalación de telefonillos, placas de calle, monitores, fuentes y sistemas de apertura.</p></article><article><h3>Cobertura móvil 4G/5G en vivienda</h3><p>Consulta soluciones de antena exterior para viviendas con cobertura débil, comprobando primero la señal disponible.</p></article><article><h3>Urgencias 24 horas</h3><p>Indica el distrito de ${esc(d.name)}, la calle y el problema observado para confirmar disponibilidad y condiciones de desplazamiento.</p></article></div></section><section class="section soft" id="distritos-madrid"><div class="wrap"><span class="eyebrow">MADRID CAPITAL</span><h2>Servicio por distritos</h2><p class="section-lead">Además de ${esc(d.name)}, puedes consultar otros distritos de Madrid capital.</p><nav class="other-towns" aria-label="Otros distritos de Madrid">${related}</nav><p><a class="text-link" href="${CITY_ROUTE}">Ver servicio general en Madrid capital →</a></p></div></section><section class="section wrap faq"><span class="eyebrow">PREGUNTAS PRÁCTICAS</span><h2>Antes de solicitar la revisión</h2><details><summary>¿Atendéis antenas y porteros en ${esc(d.name)}?</summary><p>Sí, puedes consultar instalaciones y averías de antenas, TDT, parabólicas, porteros automáticos y videoporteros indicando la dirección real dentro del distrito.</p></details><details><summary>¿Esta página significa que tenéis una oficina en ${esc(d.name)}?</summary><p>No. Es una página de cobertura para organizar el servicio por distritos de Madrid capital. La disponibilidad y el desplazamiento se confirman al contactar.</p></details><details><summary>¿Qué información ayuda a preparar el aviso?</summary><p>Distrito, calle, tipo de inmueble, síntoma y si la avería afecta a una vivienda o a varias. No hace falta desmontar equipos.</p></details></section>${renderTvReception({name:`${d.name}, Madrid`,province:'Madrid',provincePath:PROVINCE_ROUTE,path:routeFor(d)})}${renderHomeContact(provinces,contactServices,esc,{provincePath:PROVINCE_ROUTE,locality:`${d.name}, Madrid capital`})}</main><footer class="footer"><div class="wrap"><strong>${esc(site.brand)}</strong><p>Servicio técnico de antenas, porteros y videoporteros. Consulta disponibilidad por localidad.</p></div></footer><div class="mobilebar"><a href="${tel()}">☎ ${esc(site.phone)}</a><a href="${wa(d)}">WhatsApp</a></div></body></html>`;
}
function injectIndex(html,route){
 if(html.includes('id="distritos-madrid"')) return html;
 const block=`<section class="section soft madrid-districts" id="distritos-madrid"><div class="wrap"><span class="eyebrow">MADRID CAPITAL</span><h2>Distritos de Madrid capital</h2><p class="section-lead">Elige tu distrito para consultar antenas, TDT, porteros automáticos y videoporteros. Son 21 distritos de Madrid capital, separados del directorio de los 179 municipios de la Comunidad.</p><div class="province-grid madrid-district-grid">${districtCards()}</div></div></section>`;
 if(route===PROVINCE_ROUTE){
   const marker='<section class="section soft" id="localidades">';
   if(!html.includes(marker)) throw new Error('Madrid: no se encontró el directorio municipal para insertar distritos');
   return html.replace(marker,block+marker);
 }
 if(!html.includes('</main>')) throw new Error('Madrid: no se encontró </main> para insertar distritos');
 return html.replace('</main>',block+'</main>');
}
if(!Array.isArray(data.districts)||data.districts.length!==21) throw new Error(`Madrid: se esperaban 21 distritos y hay ${data.districts?.length||0}`);
if(new Set(data.districts.map(d=>d.slug)).size!==21) throw new Error('Madrid: slugs de distritos duplicados');
for(const d of data.districts){
 if(!d.name||!/^[a-z0-9-]+$/.test(d.slug)) throw new Error('Madrid: distrito inválido');
 const file=path.join(ROOT,routeFor(d).slice(1));
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,page(d));
}
for(const route of [PROVINCE_ROUTE,CITY_ROUTE]){
 const relative=route.endsWith('/') ? path.join(route.slice(1),'index.html') : route.slice(1);
 const file=path.join(ROOT,relative);
 if(!fs.existsSync(file)) throw new Error('Madrid: falta página base '+route+' ('+relative+')');
 fs.writeFileSync(file,injectIndex(fs.readFileSync(file,'utf8'),route));
}
fs.writeFileSync(path.join(ROOT,'madrid-districts-report.json'),JSON.stringify({districts:21,routes:data.districts.map(routeFor),checkedOn:data.checkedOn},null,2));
console.log('MADRID DISTRITOS OK: 21 páginas de distrito + enlaces desde Madrid capital y directorio provincial.');
