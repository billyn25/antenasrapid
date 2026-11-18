import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import data from '../content/comunidades.json' with {type:'json'};
import site from '../config/site.json' with {type:'json'};
import pages from '../content/pages.json' with {type:'json'};
import {renderFooter} from './footer.mjs';
import {renderHomeContact} from './home-contact.mjs';
import {work,renderWorkGallery,galleryStyle,galleryScript} from './real-work-gallery.mjs';

export const COMMUNITY_ROUTE=data.route;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css='<link rel="stylesheet" href="/assets/communities.css?v=20261118">';
const communityLink=`<p class="community-local-link"><a href="${data.route}">Antenas, porteros y videoporteros para comunidades de vecinos →</a></p>`;
const selectedPhotos=data.cases.map(item=>{
 const photo=work.localPhotos.find(photo=>photo.file===item.file);
 assert(photo?.townPath&&photo?.town,'Caso de comunidad sin localidad: '+item.file);
 return {...photo,title:item.title};
});
const provincePages=pages.filter(page=>page.type==='province');
export function renderCommunityPage(header){
 const url=site.domain+data.route;
 const nav=header.replace(/href="#(servicios|porteros-videoporteros|zonas|cobertura-movil)"/g,'href="/#$1"');
 const options=[{id:'amplificacion',name:'Antena colectiva y distribución de TV'},{id:'porteros',name:'Portero automático de comunidad'},{id:'videoporteros',name:'Videoportero de comunidad'},{id:'accesos',name:'Apertura del portal con llaveros'},{id:'mantenimiento',name:'Mantenimiento de la comunidad'}];
 const contact=renderHomeContact(provincePages,options,esc)
  .replace('Cuéntanos qué necesitas','Consulta para tu comunidad')
  .replace('Indica tu zona y localidad y cuéntanos qué equipo necesitas revisar. Prepararemos tu consulta para el contacto de tu zona.','Indica la localidad, cuántas viviendas tiene el edificio y qué avería o mejora necesitáis. Añade cuántos vecinos están afectados.')
  .replace('Qué falla, desde cuándo o qué instalación necesitas','Número de viviendas y portales, avería, vecinos afectados y persona de contacto');
 let gallery=renderWorkGallery({photos:selectedPhotos,route:data.route}).replace('<h2>Trabajos reales de Antenas Rapid</h2>','<h2>Trabajos y valoraciones en comunidades</h2>');
 const gallerySchema=gallery.match(/<script type="application\/ld\+json" id="real-work-schema">[\s\S]*?<\/script>/)[0];gallery=gallery.replace(gallerySchema,'');
 const schema={'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':url+'#pagina',url,name:data.title,description:data.description,inLanguage:'es',mainEntity:{'@id':url+'#servicio'}},
  {'@type':'Service','@id':url+'#servicio',name:'Antenas, porteros y videoporteros para comunidades de vecinos',url,serviceType:data.services.map(s=>s.title),audience:{'@type':'Audience',audienceType:'Comunidades de propietarios y administradores de fincas'},provider:{'@type':'Organization',name:site.brand,url:site.domain+'/',telephone:site.tel,email:site.email},areaServed:provincePages.map(p=>({'@type':'AdministrativeArea',name:p.name}))},
  {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:site.domain+'/'},{'@type':'ListItem',position:2,name:'Comunidades de vecinos',item:url}]}
 ]};
 return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(data.title)}</title><meta name="description" content="${esc(data.description)}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${url}"><meta property="og:title" content="${esc(data.title)}"><meta property="og:description" content="${esc(data.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site.domain}/assets/galeria/${selectedPhotos[0].file}"><meta property="og:type" content="website"><meta name="theme-color" content="#222327"><link rel="icon" type="image/x-icon" sizes="96x96" href="/favicon.ico"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="stylesheet" href="/assets/site.css?v=typography-20261024">${css}${galleryStyle}<script src="/assets/site.js?v=consulta-francia-20261116" defer></script><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>${gallerySchema}</head><body class="community-page"><a class="skip" href="#contenido">Saltar al contenido</a>${nav}<main id="contenido"><nav class="wrap breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Comunidades de vecinos</span></nav>
<section class="community-hero"><div class="wrap"><div><span class="eyebrow">Comunidades de propietarios · Administradores de fincas</span><h1>Antenas, porteros y videoporteros para comunidades de vecinos</h1><p class="lead">Reparación y mantenimiento de antenas colectivas, porteros automáticos y videoporteros. Revisamos las instalaciones comunes del edificio y preparamos la intervención según la avería, el número de viviendas y los accesos.</p><p><strong>Urgencias 24 horas</strong> · Consulta disponibilidad en tu localidad.</p><div class="actions"><a class="btn call" href="#contacto">Consultar avería o presupuesto</a><a class="btn light" href="#galeria">Ver trabajos reales</a></div></div><a href="/Antenas-Bizkaia/bilbao.html#galeria"><img src="/assets/galeria/${selectedPhotos[0].file}" alt="${esc(selectedPhotos[0].alt)}" width="${selectedPhotos[0].width}" height="${selectedPhotos[0].height}" fetchpriority="high"></a></div></section>
<section class="section wrap" id="servicios-comunidades"><h2>Servicios para las instalaciones comunes del edificio</h2><div class="community-services">${data.services.map(s=>`<article id="${s.id}"><h3>${s.title}</h3><p>${s.text}</p><a href="#contacto" data-contact-service="${s.service}">Consultar este servicio →</a></article>`).join('')}</div></section>
<section class="section soft"><div class="wrap"><h2>¿El fallo afecta a un vecino, a una planta o a todo el edificio?</h2><div class="community-diagnostics"><article><h3>Todos pierden los mismos canales</h3><p>Comunica los canales afectados y cuándo empezó. La revisión de la antena colectiva compara la recepción, la cabecera y la señal distribuida; el amplificador no se elige únicamente por tener más ganancia.</p></article><article><h3>La televisión falla en algunas viviendas</h3><p>Indica las plantas y tomas afectadas. Esa información ayuda a seguir la distribución del edificio y distinguir una incidencia común de un tramo de cable o una toma particular.</p></article><article><h3>El portero falla en todo el portal</h3><p>Describe por separado llamada, conversación y apertura. Comprobamos los elementos comunes, como la placa y la alimentación, y su relación con el fallo comunicado.</p></article><article><h3>Solo falla un telefonillo o monitor</h3><p>Facilita la marca y el modelo si están visibles. Comprobamos el terminal y su conexión; antes de sustituirlo, verificamos que sea compatible con el sistema del edificio.</p></article></div></div></section>
${gallery}
<section class="section wrap"><h2>Preparar la visita o el presupuesto de la comunidad</h2><ol class="community-preparation"><li><strong>Ubicación y tamaño:</strong> localidad, dirección, número de viviendas y portales.</li><li><strong>Incidencia:</strong> qué falla, desde cuándo y si afecta a todos los vecinos o a una parte del edificio.</li><li><strong>Equipos existentes:</strong> fotos de la placa, telefonillo o amplificador si están accesibles, sin desmontarlos.</li><li><strong>Acceso:</strong> persona de contacto y disponibilidad para acceder a los cuartos de instalaciones o zonas comunes.</li></ol><p>Concretamos la revisión y valoramos la reparación o renovación según el estado de la instalación. Para mantenimiento, consulta qué revisiones y materiales se incluyen.</p></section>
<section class="section soft"><div class="wrap"><h2>Comunidades en Bilbao, Madrid y otras localidades</h2><p>Atendemos avisos por desplazamiento desde Bilbao para la zona norte y Castilla y León, y desde San Sebastián de los Reyes para Madrid, Guadalajara y Toledo.</p><div class="community-shortcuts"><a href="/Antenas-Bizkaia/bilbao.html#comunidades">Antenas y porteros para comunidades en Bilbao →</a><a href="/Antenas-Madrid/madrid.html#comunidades">Antenas y porteros para comunidades en Madrid →</a><a href="/#zonas">Consultar todas las localidades →</a></div></div></section>
<section class="section wrap faq" id="preguntas"><h2>Preguntas de comunidades y administradores</h2>${data.questions.map(q=>`<details><summary>${q.question}</summary><p>${q.answer}</p></details>`).join('')}</section>
${contact}</main>${renderFooter()}<div class="mobilebar"><a href="#contacto">Consultar comunidad</a><a href="https://wa.me/${site.whatsapp}">WhatsApp zona norte</a></div>${galleryScript}</body></html>`;
}
export function linkCommunityService(html){
 return html.replace(/(<section\b[^>]*id="porteros-videoporteros"[^>]*>[\s\S]*?<p class="section-lead">[\s\S]*?<\/p>)([\s\S]*?<\/section>)/, (all,lead,rest)=>all.includes('class="community-local-link"')?all:lead+communityLink+rest);
}
function feature(city=''){
 const local=city==='Bilbao'?'<p>En Bilbao puedes ver una <a href="/Antenas-Bizkaia/bilbao.html#galeria">instalación real de videoportero BTicino</a>. También tenemos una <a href="/Antenas-Bizkaia/getxo.html#galeria">valoración de cambio a videoportero en Getxo</a> y un <a href="/Antenas-Bizkaia/balmaseda.html#galeria">trabajo de videoportero en Balmaseda</a>.</p>':city==='Madrid'?'<p>Consulta la <a href="/Antenas-Madrid/torrejon-de-ardoz.html#galeria">apertura con llaveros de una comunidad en Torrejón de Ardoz</a>, el <a href="/Antenas-Madrid/alcala-de-henares.html#galeria">cambio a portero de dos hilos en Alcalá de Henares</a> y la <a href="/Antenas-Madrid/valdilecha.html#galeria">reparación de pulsadores Fermax en Valdilecha</a>.</p>':'';
 return `<section class="section soft community-feature" id="comunidades"><div class="wrap"><div><span class="eyebrow">Comunidades de vecinos</span><h2>${city?'Antenas colectivas y porteros para comunidades en '+city:'Servicio para comunidades y administradores de fincas'}</h2><p>Reparación de antenas colectivas, porteros y videoporteros, renovación de equipos y apertura del portal con llaveros. Indica el número de viviendas y si la avería afecta a un vecino, a una planta o a todo el edificio.</p>${local}</div><nav class="community-shortcuts" aria-label="Servicios para comunidades"><a href="${data.route}#antenas-colectivas">Reparación de antenas colectivas →</a><a href="${data.route}#porteros-comunidades">Porteros y videoporteros de comunidad →</a><a href="${data.route}#contacto">Consultar una avería o presupuesto →</a></nav></div></section>`;
}
export function applyCommunities(root='dist'){
 const homeFile=path.join(root,'index.html');const home=fs.readFileSync(homeFile,'utf8');const header=home.match(/<header>[\s\S]*?<\/header>/)?.[0];assert(header,'Falta cabecera para comunidades');
 fs.copyFileSync(new URL('../src/communities.css',import.meta.url),path.join(root,'assets/communities.css'));
 const file=path.join(root,data.route.slice(1),'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,renderCommunityPage(header));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 const targets=[{path:'/index.html',name:''},...provincePages.map(p=>({path:p.path+'index.html',name:p.name})),...manifest];
 for(const page of targets){
  const file=path.join(root,page.path.slice(1));let html=fs.readFileSync(file,'utf8');
  html=linkCommunityService(html);
  const city=page.path==='/Antenas-Bizkaia/bilbao.html'?'Bilbao':page.path==='/Antenas-Madrid/madrid.html'?'Madrid':'';
  if((page.path==='/index.html'||city)&&!html.includes('id="comunidades"')){
   const marker=html.match(/<section\b[^>]*id="porteros-videoporteros"[^>]*>/)?.[0];assert(marker,'Falta sección de porteros: '+page.path);html=html.replace(marker,feature(city)+marker);
  }
  if(!html.includes(css))html=html.replace('</head>',css+'</head>');
  fs.writeFileSync(file,html);
 }
 console.log(`COMUNIDADES OK: página propia, ${selectedPhotos.length} fotos reales, portada, Bilbao, Madrid y enlaces en ${targets.length} fichas.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyCommunities();
