/** Reuse the current Madrid municipal shell for the 21 district pages only. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import data from '../content/madrid-districts.json' with {type:'json'};

export const version='madrid-district-design-v1';
const marker=`data-district-design="${version}"`;
const headerRE=/<header\b[^>]*>[\s\S]*?<\/header>/g;
const footerRE=/<footer\b[^>]*>[\s\S]*?<\/footer>/g;
const mobileRE=/<div class="mobilebar">[\s\S]*?<\/div>/g;
const cssRE=/<link rel="stylesheet" href="\/assets\/site\.css[^\"]*">/g;
const urgentRE=/<style id="urgent-24h-style">[\s\S]*?<\/style>/g;
const noticeRE=/<aside class="cookie-notice"[^>]*>[\s\S]*?<\/aside>/g;
const mainRE=/<main\b[^>]*>[\s\S]*?<\/main>/g;
const one=(html,re,label)=>{
 const matches=[...html.matchAll(re)];assert.equal(matches.length,1,label+': elemento ausente o duplicado');return matches[0][0];
};
export const districtStyles=`<style id="madrid-district-design-style">
/* Uses the current brand tokens; applies only to district-specific content. */
[data-district-page="madrid"] .local-intents{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:24px}
[data-district-page="madrid"] .local-intents article{min-width:0;background:#fff;border:1px solid var(--line);border-top:3px solid var(--brand);border-radius:12px;padding:22px;box-shadow:0 8px 24px rgba(29,31,35,.04);scroll-margin-top:150px}
[data-district-page="madrid"] .local-intents h3{font-size:19px;line-height:1.3;margin:0 0 12px;color:var(--ink)}
[data-district-page="madrid"] .local-intents p{font-size:15px;line-height:1.65;color:var(--muted);margin:0}
[data-district-page="madrid"] .other-towns{display:flex;flex-wrap:wrap;gap:10px}
[data-district-page="madrid"] .other-towns a{padding:11px 14px;min-height:44px;background:#fff;border:1px solid var(--line);border-radius:9px;font-weight:700;color:var(--brand);line-height:1.4}
[data-district-page="madrid"] .other-towns a:hover{border-color:var(--brand)}
[data-district-page="madrid"] .other-towns a:focus-visible{outline:3px solid var(--brand);outline-offset:3px}
[data-district-page="madrid"] .contact-panel{border-radius:12px}
@media(max-width:1000px){[data-district-page="madrid"] .local-intents{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:600px){[data-district-page="madrid"] .local-intents{grid-template-columns:minmax(0,1fr);gap:12px}[data-district-page="madrid"] .local-intents article{padding:19px}[data-district-page="madrid"] .other-towns a{flex:1 1 140px}[data-district-page="madrid"] .contact-panel{padding:24px 20px}}
</style>`;

export function assertDistrictDesign(html,city,label='Distrito'){
 assert.ok(html.includes(marker),label+': falta la versión de diseño');
 assert.equal(one(html,headerRE,label+' cabecera'),one(city,headerRE,'Madrid cabecera'),label+': cabecera distinta de la municipal');
 assert.equal(one(html,cssRE,label+' CSS'),one(city,cssRE,'Madrid CSS'),label+': CSS distinto de la municipal');
 assert.equal(one(html,urgentRE,label+' urgencias'),one(city,urgentRE,'Madrid urgencias'));
 assert.equal(one(html,footerRE,label+' pie'),one(city,footerRE,'Madrid pie'),label+': pie distinto del municipal');
 assert.equal(one(html,mobileRE,label+' barra'),one(city,mobileRE,'Madrid barra'));
 assert.equal(one(html,noticeRE,label+' aviso'),one(city,noticeRE,'Madrid aviso'));
 assert.equal((one(html,headerRE,'cabecera').match(/class="rapid-brand-logo"/g)||[]).length,1,label+': logotipo oficial ausente o duplicado');
 assert.ok(html.includes('/assets/logo-antenasrapid.webp'));
 assert.ok(html.includes('class="hero home-clean-hero madrid-photo-hero"'));
 assert.equal(html.split(districtStyles).length-1,1,label+': estilos locales ausentes o duplicados');
 const main=one(html,mainRE,label+' contenido');
 for(const id of ['servicios','porteros-videoporteros','cobertura-movil','distritos-madrid','contacto'])assert.ok(main.includes(`id="${id}"`),label+': menú sin destino '+id);
 return true;
}

export function upgradeDistrict(html,city){
 assert.ok(html.includes('data-district-page="madrid"'),'Solo se actualizan fichas de distrito');
 if(html.includes(marker)){assertDistrictDesign(html,city);return html;}
 const before=html;
 html=html.replace(headerRE,()=>one(city,headerRE,'Madrid cabecera'))
  .replace(footerRE,()=>one(city,footerRE,'Madrid pie'))
  .replace(mobileRE,()=>one(city,mobileRE,'Madrid barra'))
  .replace(cssRE,()=>one(city,cssRE,'Madrid CSS'));
 assert.ok(!html.includes('id="urgent-24h-style"'),'No se deben duplicar estilos de urgencias');
 assert.ok(!html.includes('data-cookie-notice'),'El distrito ya tiene aviso: revisar antes de reemplazar');
 html=html.replace('</head>',one(city,urgentRE,'Madrid urgencias')+districtStyles+'</head>');
 html=html.replace(one(html,mobileRE,'Distrito barra'),m=>one(city,noticeRE,'Madrid aviso')+m);
 html=html.replace('<section class="hero">',`<section class="hero home-clean-hero madrid-photo-hero" ${marker}>`)
  .replace('<div class="hero-copy">','<div class="hero-copy"><span class="urgent-hero">Urgencias 24h</span>')
  .replace('class="breadcrumbs wrap"','class="breadcrumb wrap"')
  .replace('<section class="section wrap"><span class="eyebrow">SERVICIO TÉCNICO','<section class="section wrap" id="servicios"><span class="eyebrow">SERVICIO TÉCNICO')
  .replace('<article><h3>Porteros automáticos y videoporteros</h3>','<article id="porteros-videoporteros"><h3>Porteros automáticos y videoporteros</h3>')
  .replace('<article><h3>Cobertura móvil 4G/5G en vivienda</h3>','<article id="cobertura-movil"><h3>Cobertura móvil 4G/5G en vivienda</h3>')
  .replace(/<a class="btn" href="tel:/g,'<a class="btn call" href="tel:')
  .replace(/<a class="btn" href="https:\/\/wa.me\//g,'<a class="btn wa" href="https://wa.me/');
 // Keep every district's metadata, schema, text and existing content links.
 for(const re of [/<title>[\s\S]*?<\/title>/g,/<meta\b[^>]*>/g,/<link rel="canonical"[^>]*>/g,/<script type="application\/ld\+json">[\s\S]*?<\/script>/g]){
  assert.deepEqual([...html.matchAll(re)].map(m=>m[0]),[...before.matchAll(re)].map(m=>m[0]),'Metadatos modificados');
 }
 const oldMain=one(before,mainRE,'Contenido anterior'),newMain=one(html,mainRE,'Contenido actual');
 const text=h=>h.replace('<span class="urgent-hero">Urgencias 24h</span>','').replace(/<[^>]*>/g,'');
 assert.equal(text(newMain),text(oldMain),'Texto del distrito modificado');
 assert.deepEqual([...newMain.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),[...oldMain.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),'Enlaces del distrito modificados');
 assertDistrictDesign(html,city);return html;
}

export function applyDistrictDesign(root='dist',auditOnly=false){
 assert.equal(data.districts.length,21);assert.equal(new Set(data.districts.map(d=>d.slug)).size,21);
 const city=fs.readFileSync(path.join(root,'Antenas-Madrid/madrid.html'),'utf8');
 const pending=data.districts.map(d=>{
  const file=path.join(root,'Antenas-Madrid',d.slug+'.html'),before=fs.readFileSync(file,'utf8');
  const after=auditOnly?before:upgradeDistrict(before,city);assertDistrictDesign(after,city,d.name);return {file,before,after};
 });
 // All 21 transformations must pass before changing any output file.
 if(!auditOnly)for(const {file,before,after} of pending)if(after!==before)fs.writeFileSync(file,after);
 console.log(`DISEÑO DISTRITOS OK: 21/21 con logo, CSS, cabecera, pie y barra de Madrid; URLs, contenido y metadatos conservados.`);
 return pending.length;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyDistrictDesign(process.env.PRODUCTION_ROOT||'dist',process.argv.includes('--audit'));
