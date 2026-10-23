import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {assertNearbyFooter} from './nearby-footer.mjs';

const RELEASE='20261023';
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

export function orderTownSections(html,page){
 if(html.includes(`data-town-order="${RELEASE}"`))return fitDistricts(html);
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);assert.ok(main,page.path+': falta main');
 const nodes=children(main[1]);const names=new Set();
 const ordered=nodes.map((original,index)=>{
  let node=original;const classes=classOf(node),id=idOf(node);let rank;
  rank=nodeRank(node,page.path);
  if(id){assert.ok(!names.has(id),page.path+': bloque duplicado '+id);names.add(id);}
  if(id==='servicios')node=node.replace(/(<span class="eyebrow">)[\s\S]*?(<\/span>)/,(_,a,b)=>a+'Servicios disponibles'+b);
  if(id==='servicio-local')node=heading(node,'Instalaciones y trabajos que atendemos en '+escape(page.name));
  if(classes.includes('local-service-depth'))node=heading(node,'Averías que revisamos en '+escape(page.name));
  if(classes.includes('madrid-seo-depth'))node=heading(node,'Cómo preparar una intervención en '+escape(page.name));
  return {node,index,rank,original};
 }).sort((a,b)=>a.rank-b.rank||a.index-b.index);
 for(const id of ['servicios','problemas-tdt','porteros-videoporteros','cobertura-movil','experiencia','contexto-municipal','servicio-local','preguntas','contacto','zonas','pueblos-cercanos'])assert.ok(names.has(id),page.path+': falta '+id);
 let after=html.replace(main[0],()=>opening(main[0]).slice(0,-1)+` data-town-order="${RELEASE}">`+ordered.map(x=>x.node).join('\n')+'</main>');
 after=fitDistricts(after);
 // Fail the build if anything except approved labels, whitespace and node order changes.
 for(const re of [/<header\b[\s\S]*?<\/header>/g,/<footer\b[\s\S]*?<\/footer>/g,/<h1\b[^>]*>[\s\S]*?<\/h1>/g,/<p\b[^>]*>[\s\S]*?<\/p>/g,/<summary\b[^>]*>[\s\S]*?<\/summary>/g,/<a\b[^>]*>/g,/<img\b[^>]*>/g,/<meta\b[^>]*>/g,/<title>[\s\S]*?<\/title>/g,/<link\b[^>]*>/g,/<form\b[\s\S]*?<\/form>/g,/<script\b[\s\S]*?<\/script>/g,/<style\b[\s\S]*?<\/style>/g,/\bid="[^"]+"/g])assert.deepEqual(signature(after.replace(responsiveStyle,''),re),signature(html.replace(responsiveStyle,''),re),page.path+': contenido protegido modificado');
 const heroes=items=>items.filter(n=>classOf(n).includes('hero'));
 assert.deepEqual(heroes(children(after.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1])),heroes(nodes),page.path+': hero cambiado');
 assertTownOrder(after,page);
 return after;
}
export function assertTownOrder(html,page){
 assert.ok(html.includes(`data-town-order="${RELEASE}"`),page.path+': falta versión de orden');
 const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);assert.ok(main);
 let last=-Infinity;
 for(const node of children(main[1])){
  if(/^<style\b/.test(node))continue;
  const rank=nodeRank(node,page.path);assert.ok(rank>=last,page.path+': bloque fuera de orden '+opening(node));last=rank;
 }
 assertNearbyFooter(html,page.path);
}

export function applyTownOrder(root='dist',auditOnly=false){
 const towns=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 for(const page of towns){const file=path.join(root,page.path.slice(1)),before=fs.readFileSync(file,'utf8');if(auditOnly)assertTownOrder(before,page);else fs.writeFileSync(file,orderTownSections(before,page));}
 console.log(`ORDEN MUNICIPAL OK: ${towns.length} pueblos; servicios, TDT, accesos, conectividad, diagnóstico, marcas, preparación, preguntas, contacto y cercanos. Contenido protegido conservado.`);
 return towns.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyTownOrder(process.env.PRODUCTION_ROOT||'dist',process.argv.includes('--audit'));
