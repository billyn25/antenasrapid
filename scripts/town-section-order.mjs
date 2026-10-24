import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {assertNearbyFooter} from './nearby-footer.mjs';

const RELEASE='20261024-grouped';
const responsiveStyle='<style id="town-order-responsive">[data-town-order] #distritos-madrid .province-card{min-width:0;overflow-wrap:anywhere}</style>';
const fitDistricts=html=>html.includes('id="distritos-madrid"')&&!html.includes('id="town-order-responsive"')?html.replace('</head>',responsiveStyle+'</head>'):html;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opening=node=>node.slice(0,node.indexOf('>')+1);
const classOf=node=>opening(node).match(/\bclass="([^"]*)"/)?.[1].split(/\s+/)||[];
const idOf=node=>opening(node).match(/\bid="([^"]+)"/)?.[1];

// Move balanced, complete HTML nodes. Never serialize or reconstruct their bodies.
function children(html){
 const tags=/<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
 const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
 const stack=[],nodes=[];let start=-1;
 for(const match of html.matchAll(tags)){
  if(match[0].startsWith('<!--'))continue;
  const tag=match[0].match(/^<\/?([a-z][\w:-]*)/i)?.[1].toLowerCase();if(!tag)continue;
  if(match[0].startsWith('</')){
   assert.equal(stack.pop(),tag,'Cierre HTML inesperado: '+tag);
   if(!stack.length){nodes.push(html.slice(start,match.index+match[0].length));start=-1;}
  }else{
   if(!stack.length)start=match.index;
   if(voids.has(tag)||match[0].endsWith('/>')){if(!stack.length){nodes.push(match[0]);start=-1;}}
   else stack.push(tag);
  }
 }
 assert.equal(stack.length,0,'HTML sin cerrar');
 assert.equal(nodes.join('').replace(/\s/g,''),html.replace(/\s/g,''),'Contenido fuera de los bloques previstos');
 return nodes;
}
const ranks={servicios:10,'problemas-tdt':20,'porteros-videoporteros':30,'cobertura-movil':40,'soluciones-tecnicas':50,'servicio-local':60,experiencia:70,galeria:80,'gallery-lightbox':81,'contexto-municipal':90,'codigos-postales':91,'distritos-madrid':92,preguntas:100,contacto:110,zonas:120,'pueblos-cercanos':130};
function nodeRank(node,label){
 const classes=classOf(node),id=idOf(node);let rank;
 if(/^<style\b/.test(node))rank=5; // Keep all original styles in their original cascade order.
 else if(classes.includes('breadcrumb'))rank=-10;
 else if(classes.includes('hero'))rank=0;
 else if(classes.includes('strip'))rank=1;
 else if(id in ranks)rank=ranks[id];
 else if(classes.includes('local-service-depth'))rank=61;
 else if(classes.includes('madrid-seo-depth'))rank=62;
 else if(classes.includes('madrid-service-links'))rank=63;
 else assert.fail(label+': bloque desconocido '+opening(node));
 return rank;
}

const heading=(node,text)=>node.replace(/(<h2\b[^>]*>)[\s\S]*?(<\/h2>)/,(_,a,b)=>a+text+b);
const signature=(html,re)=>[...html.matchAll(re)].map(m=>m[0]).sort();

const GROUP_STYLE='<style id="town-groups-style">.town-contact-group{padding-top:36px}.town-contact-group>h2.wrap{font-size:30px;line-height:1.25;margin:0 auto 18px}.town-contact-group>.town-contact-form{padding-bottom:20px}.town-contact-group>.town-contact-form{padding-top:20px}.town-visit-preparation{padding:24px 0 0}.town-contact-group .town-visit-preparation>.wrap{width:100%}.town-preparation-details{width:min(1200px,calc(100% - 48px));margin:0 auto 12px}.town-preparation-details>summary{cursor:pointer;padding:14px 0;min-height:44px;font-weight:700;font-size:16px}.town-visit-preparation h3{font-size:20px;line-height:1.35}.town-extra-diagnostics{margin-top:28px;padding-top:24px;border-top:1px solid var(--line)}.town-extra-diagnostics>h3{margin-top:0}.town-extra-diagnostics .local-depth-grid{margin-bottom:16px}.town-contact-group .municipal-layout{gap:20px}.town-contact-group .municipal-facts dd{font-size:22px}@media(max-width:760px){.town-contact-group{padding-top:24px}.town-contact-group>h2.wrap{font-size:25px;margin:0 auto 12px}.town-preparation-details{width:calc(100% - 32px);margin-bottom:0}.town-contact-group>.town-contact-form{padding-top:16px}.town-visit-preparation h3{font-size:18px}.town-visit-preparation{padding-top:20px}.town-extra-diagnostics{margin-top:22px;padding-top:20px}}@media(max-width:359px){.town-preparation-details{width:calc(100% - 24px)}}</style>';
function subordinate(node,classes){
 return node.replace(/^<section\b[^>]*>/,opening=>opening.replace('<section','<div').replace(/class="[^"]*"/,`class="${classes}"`)).replace(/<\/section>$/,'</div>').replace(/<h2(\b[^>]*)>/g,'<h3$1>').replace(/<\/h2>/g,'</h3>');
}
export function orderTownSections(html,page){
 if(html.includes(`data-town-order="${RELEASE}"`))return fitDistricts(html);
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);assert.ok(main,page.path+': falta main');
 const nodes=children(main[1]);const names=new Set();
 for(const node of nodes){const id=idOf(node);if(id){assert(!names.has(id),page.path+': bloque duplicado '+id);names.add(id);}}
 for(const id of ['servicios','problemas-tdt','porteros-videoporteros','cobertura-movil','experiencia','contexto-municipal','servicio-local','preguntas','contacto','zonas','pueblos-cercanos'])assert(names.has(id),page.path+': falta '+id);
 // The generic catalogue repeats the nine main service cards. Bilbao's former
 // neighbourhood block is superseded by its sourced geographic coverage block.
 const discarded=nodes.filter(n=>['servicio-local','zonas'].includes(idOf(n)));
 const extras=nodes.filter(n=>classOf(n).includes('local-service-depth')||classOf(n).includes('madrid-service-links'));
 const preparation=nodes.filter(n=>idOf(n)==='contexto-municipal'||classOf(n).includes('madrid-seo-depth'));
 const absorbed=new Set([...discarded,...extras,...preparation]);
 let ordered=nodes.filter(n=>!absorbed.has(n)).map((original,index)=>{
  let node=original;const id=idOf(node);
  if(id==='servicios')node=node.replace(/(<span class="eyebrow">)[\s\S]*?(<\/span>)/,(_,a,b)=>a+'Servicios disponibles'+b);
  if(id==='soluciones-tecnicas'){
   node=heading(node,'Soluciones y diagnóstico de instalaciones en '+escape(page.name));
   const detail=extras.map(n=>subordinate(heading(n,classOf(n).includes('local-service-depth')?'Identifica la avería antes de pedir asistencia':'Consulta por tipo de servicio'),'town-extra-diagnostics '+classOf(n).filter(c=>!['section','wrap'].includes(c)).join(' '))).join('');
   node=node.replace(/<\/section>$/,detail+'</section>');
  }
  if(id==='contacto'){
   const form=node.replace(/<h2(\b[^>]*)>/g,'<h3$1>').replace(/<\/h2>/g,'</h3>').replace(/^<section\b[^>]*>/,opening=>opening.replace('<section','<div').replace(/\s+id="contacto"/,'').replace(/class="([^"]*)"/,'class="$1 town-contact-form"')).replace(/<\/section>$/,'</div>');
   const prep=preparation.map(n=>subordinate(n,'town-visit-preparation '+classOf(n).filter(c=>!['section','soft','wrap'].includes(c)).join(' '))).join('');
   node=`<section class="section town-contact-group" id="contacto"><h2 class="wrap">Preparar tu consulta en ${escape(page.name)}</h2><details class="town-preparation-details"><summary>Qué datos conviene preparar antes de la visita</summary>${prep}</details>${form}</section>`;
  }
  if(id==='pueblos-cercanos')node=node.replace(/(<section\b[^>]*>)/,'$1<span id="zonas" aria-hidden="true"></span>');
  return {node,index,rank:nodeRank(node,page.path)};
 }).sort((a,b)=>a.rank-b.rank||a.index-b.index);
 assert(ordered.some(n=>idOf(n.node)==='soluciones-tecnicas'),page.path+': falta diagnóstico');
 const mainOpen=opening(main[0]).replace(/\sdata-town-order="[^"]*"/,'').slice(0,-1);
 let after=html.replace(main[0],()=>mainOpen+` data-town-order="${RELEASE}">`+ordered.map(x=>x.node).join('\n')+'</main>');
 after=fitDistricts(after).replace('</head>',GROUP_STYLE+'</head>');
 // All useful diagnostics, forms, images, metadata and supporting paragraphs
 // survive. Only the explicitly superseded catalogue and provincial CTA go.
 let baseline=html;for(const node of discarded)baseline=baseline.replace(node,'');
 baseline+='<span id="zonas" aria-hidden="true"></span><summary>Qué datos conviene preparar antes de la visita</summary>';
 for(const re of [/<header\b[\s\S]*?<\/header>/g,/<footer\b[\s\S]*?<\/footer>/g,/<h1\b[^>]*>[\s\S]*?<\/h1>/g,/<p\b[^>]*>[\s\S]*?<\/p>/g,/<summary\b[^>]*>[\s\S]*?<\/summary>/g,/<a\b[^>]*>/g,/<img\b[^>]*>/g,/<meta\b[^>]*>/g,/<title>[\s\S]*?<\/title>/g,/<link\b[^>]*>/g,/<form\b[\s\S]*?<\/form>/g,/<script\b[\s\S]*?<\/script>/g,/\bid="[^"]+"/g])assert.deepEqual(signature(after.replace(responsiveStyle,'').replace(GROUP_STYLE,''),re),signature(baseline.replace(responsiveStyle,''),re),page.path+': contenido protegido modificado');
 assertTownOrder(after,page);return after;
}
export function assertTownOrder(html,page){
 assert.ok(html.includes(`data-town-order="${RELEASE}"`),page.path+': falta versión de orden');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);assert.ok(main);
 let last=-Infinity;
 for(const node of children(main[1])){
  if(/^<style\b/.test(node))continue;
  const rank=nodeRank(node,page.path);assert.ok(rank>=last,page.path+': bloque fuera de orden '+opening(node));last=rank;
 }
 assert.equal((html.match(/id="contacto"/g)||[]).length,1,page.path);
 assert(!html.includes('id="servicio-local"'),page.path+': catálogo redundante');
 assert.equal((html.match(/id="contexto-municipal"/g)||[]).length,1,page.path);
 const contact=main[1].indexOf('id="contacto"');
 assert(main[1].indexOf('id="contexto-municipal"')>contact,page.path+': preparación junto al formulario');
 assert(main[1].indexOf('id="zonas"')>main[1].indexOf('id="pueblos-cercanos"'),page.path+': navegación reunida');
 assertNearbyFooter(html,page.path);
}

export function applyTownOrder(root='dist',auditOnly=false){
 const towns=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 for(const page of towns){const file=path.join(root,page.path.slice(1)),before=fs.readFileSync(file,'utf8');if(auditOnly)assertTownOrder(before,page);else fs.writeFileSync(file,orderTownSections(before,page));}
 console.log(`ORDEN MUNICIPAL OK: ${towns.length} pueblos; servicios, TDT, accesos, diagnóstico unificado, marcas, cobertura local, preguntas, preparación y formulario, navegación final.`);
 return towns.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyTownOrder(process.env.PRODUCTION_ROOT||'dist',process.argv.includes('--audit'));
