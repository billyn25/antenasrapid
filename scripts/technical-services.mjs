import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modules = [
 ['Antenas Televés con dipolo y sistema BOSS','Elegimos la antena según la señal medida: dipolo pasivo o sistema activo BOSS con su alimentación compatible. Comprobamos nivel y calidad para evitar amplificar una señal ya saturada.'],
 ['Fagor Rhombus y antenas EK BLUE','Instalación y sustitución de antenas Fagor Rhombus y EK BLUE según cobertura, orientación y necesidades de la instalación. Valoramos directividad, filtrado y estado del mástil antes de elegir modelo.'],
 ['Moduladores HDMI a TDT para varias televisiones','Instalación de modulador digital COFDM para distribuir una fuente HDMI como canal de televisión por la red coaxial de bares, locales o comunidades. Ajustamos canal de salida y nivel, verificamos compatibilidad y evitamos solapar los múltiplex recibidos.'],
 ['Reparación de repetidores y reemisores TDT de pueblos','Valoración de averías en repetidores de televisión y pequeños reemisores municipales: alimentación, recepción, procesado y salida de señal. La intervención se coordina con el titular o responsable autorizado; se comprueba primero si el fallo afecta al emisor o a la instalación receptora.'],
 ['Interferencias 4G/5G y filtros LTE700','Si la televisión se pixela o pierde canales, medimos la señal antes de incorporar un filtro. Elegimos el filtrado y su ubicación según la interferencia detectada, sin confundir mala recepción con exceso de amplificación.'],
 ['Antenas directivas frente a ecos y rebotes','Ante señales de distintos repetidores, estudiamos orientación, altura y directividad de la antena. Los ecos o solapes requieren comprobar calidad y estabilidad; aumentar la ganancia no resuelve por sí solo la interferencia.'],
 ['Centrales programables y ajuste de cabeceras','Revisión y programación de centrales de amplificación para equilibrar múltiplex y niveles de salida. Cuando la cabecera admite conversión de canales, se estudia la frecuencia disponible y la compatibilidad de toda la distribución.'],
 ['Cable negro de polietileno para exterior','Renovación de tramos expuestos con coaxial apto para intemperie, cubierta de polietileno y conexiones protegidas. Revisamos entradas de agua, pérdidas, sujeción y recorrido hasta las tomas interiores.'],
 ['Diplexores para mezclar TDT y satélite','Combinamos y separamos TDT y señal de satélite con diplexores compatibles con las bandas utilizadas y el paso de corriente requerido. Comprobamos tomas, repartidores y alimentación del LNB antes de aprovechar un solo cable.'],
 ['Mástiles, anclajes y antenas movidas por viento','Revisión de antenas desplazadas, soportes deteriorados y fijaciones. Se valora el acceso y el estado del conjunto antes de orientar, sustituir o reforzar elementos de la instalación.'],
 ['Conectores blindados y pérdidas en tomas','Localizamos cortes, falsos contactos y pérdidas en conectores, repartidores, derivadores y tomas. Sustituimos conexiones deterioradas y comprobamos la señal al final del recorrido, no solo junto a la antena.'],
 ['Medición y equilibrado de señal TDT','Diagnóstico con medidor de campo para comprobar nivel, MER y BER, ajustar amplificación y verificar las tomas. El objetivo es una recepción estable con margen de calidad, no obtener únicamente más potencia.']
];
const hash = s => {
 let value=2166136261;
 for(const c of s) value=Math.imul(value^c.charCodeAt(0),16777619);
 value=Math.imul(value^(value>>>16),0x45d9f3b);
 return (value^(value>>>16))>>>0;
};
export function technicalBlock(name, key, home=false) {
 const extra=modules.slice(4);
 const selected=home ? modules : [...modules.slice(0,4),...extra.map((value,i)=>({value,rank:hash(`${key}:${i}`)})).sort((a,b)=>a.rank-b.rank).slice(0,3).map(x=>x.value)];
 const where=home?'':` en ${esc(name)}`;
 return `<section class="section wrap technical-services" id="soluciones-tecnicas" data-technical-services="20261020"><span class="eyebrow">Recepción · Distribución · Diagnóstico</span><h2>Soluciones técnicas de antenas${where}</h2><p class="section-lead">${home?'Trabajos para viviendas, comunidades, bares y responsables de instalaciones de televisión.':`Para una instalación${where}, la solución depende de la señal disponible, el cableado y los equipos existentes.`} Cuéntanos el síntoma y el uso que necesitas: seleccionamos materiales y ajustes después de revisar la instalación.</p><div class="technical-grid">${selected.map(([title,text])=>`<article><h3>${esc(title)}${where}</h3><p>${esc(text)}</p><a href="#contacto">Consultar este trabajo${where} →</a></article>`).join('')}</div></section>`;
}
export function apply(root='dist') {
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 const targets=[{name:'',path:'/',home:true},...manifest];
 for(const p of targets){
  const file=path.join(root,p.path==='/'?'index.html':p.path.slice(1));
  let h=fs.readFileSync(file,'utf8');
  if(h.includes('data-technical-services="20261020"'))continue;
  if(!p.home) h=h.replace(/<section class="hero">/,'<section class="hero home-clean-hero town-photo-hero">');
  const marker='<section class="section wrap faq"';
  assert(h.includes(marker),`${p.path}: falta FAQ`);
  h=h.replace(marker,technicalBlock(p.name,p.path,p.home)+marker);
  assert(h.includes('home-clean-hero'),`${p.path}: falta foto hero`);
  fs.writeFileSync(file,h);
 }
 const css=path.join(root,'assets/site.css');
 fs.appendFileSync(css,`\n.technical-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.technical-grid article{min-width:0;padding:24px;border:1px solid var(--line);border-top:3px solid var(--brand);border-radius:10px;background:#fff}.technical-grid h3{font-size:21px;line-height:1.3;margin:0 0 12px;overflow-wrap:anywhere}.technical-grid p{line-height:1.7;color:var(--muted);margin:0 0 16px}.technical-grid a{font-weight:700;color:var(--brand)}.town-photo-hero .hero-copy{padding:20px;border-radius:12px;background:rgba(3,10,17,.63)}@media(max-width:760px){.technical-grid{grid-template-columns:1fr}.technical-grid article{padding:20px}.town-photo-hero .hero-copy{padding:16px}}\n`);
 console.log(`TÉCNICA Y HERO OK: ${manifest.length} municipios con foto y siete servicios técnicos; portada con doce soluciones.`);
}
if(process.argv[1]?.endsWith('/technical-services.mjs'))apply();
