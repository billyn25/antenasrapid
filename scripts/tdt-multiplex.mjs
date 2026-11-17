import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const data=JSON.parse(fs.readFileSync(new URL('../content/tdt-multiplex.json',import.meta.url),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byMunicipality=new Map();
for(const [area,entry] of Object.entries(data.areas)){
 for(const channel of [entry.mpe5,entry.rge2])assert(Number.isInteger(channel)&&channel>=21&&channel<=48);
 for(const code of entry.municipalities){
  assert(!byMunicipality.has(code),'Municipio con varias áreas: '+code);
  byMunicipality.set(code,{area,mpe5:entry.mpe5,rge2:entry.rge2});
 }
}
export const multiplexFor=code=>byMunicipality.get(String(code));
export function renderMultiplex(page){
 const frequencies=multiplexFor(page.municipioId);
 assert(frequencies,'Municipio sin planificación TDT: '+page.name);
 const {area,mpe5,rge2}=frequencies;
 return `<section class="section soft" id="sintonizar-tdt"><div class="wrap"><h2>La Séptima y canales UHD en ${esc(page.name)}</h2><p>Canales UHF de referencia para ${esc(page.name)}, ${esc(page.province)}. Zona de emisión: <strong>${esc(area)}</strong>.</p><div class="tdt-mux-grid"><article><h3>La Séptima HD · MPE5</h3><p class="tdt-mux-channel">Canal UHF ${mpe5} · ${474+8*(mpe5-21)} MHz</p><p>Este múltiplex también reúne DKISS, TEN y Real Madrid TV.</p></article><article><h3>Televisión UHD · RGE2</h3><p class="tdt-mux-channel">Canal UHF ${rge2} · ${474+8*(rge2-21)} MHz</p><p>La 1 UHD, La 2 UHD, Antena 3 UHD y Telecinco UHD. Necesitas un televisor o receptor compatible con UHD, DVB-T2 y HEVC/H.265.</p></article></div><h3>Si no aparecen al buscar los canales</h3><p>Prueba una búsqueda automática y, si faltan, una búsqueda manual en estos canales UHF. Si tu antena recibe desde otro repetidor, la frecuencia puede variar. Cuando falta todo un múltiplex, revisamos la señal y la amplificación de la instalación.</p><p class="tdt-mux-source">Actualizado el 17/11/2026 · <a href="${data.source}">Frecuencias TDT</a> · <a href="${data.channelSource}">Cambios de canales</a></p></div></section>`;
}
const style='<style id="tdt-mux-style">.tdt-mux-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.tdt-mux-grid article{padding:20px;border:1px solid var(--line);border-radius:12px}.tdt-mux-grid h3{margin-top:0}.tdt-mux-channel{font-size:1.2rem;font-weight:700}.tdt-mux-source{font-size:.85rem}@media(max-width:650px){.tdt-mux-grid{grid-template-columns:1fr}}</style>';
export function applyMultiplex(root='dist'){
 const pages=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 for(const page of pages){
  const file=path.join(root,page.path.slice(1));let html=fs.readFileSync(file,'utf8');
  html=html.replace(/<section\b[^>]*id="sintonizar-tdt"[^>]*>[\s\S]*?<\/section>/g,'').replace(/<style id="tdt-mux-style">[\s\S]*?<\/style>/g,'');
  const marker=html.match(/<section\b[^>]*id="pueblos-cercanos"[^>]*>/)?.[0];
  assert(marker,page.path+': falta cierre de localidades');
  html=html.replace(marker,renderMultiplex(page)+marker).replace('</head>',style+'</head>');
  fs.writeFileSync(file,html);
 }
 console.log(`TDT MUX OK: ${pages.length} municipios, canales por área geográfica oficial.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyMultiplex();
