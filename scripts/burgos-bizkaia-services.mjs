import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {canonicalPath,publicRouteMap} from './canonical-urls.mjs';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const services=[
 ['tdt','Reparación de antenas TDT','La imagen se pixela, faltan grupos de canales o aparece «sin señal».','Comprueba sin desmontar nada si sucede en una sola toma, en varios televisores o también a otros vecinos. Anota los canales afectados y desde cuándo ocurre.','La revisión distingue recepción, conectores, cable coaxial y distribución. Una resintonización no corrige una señal defectuosa; antes de cambiar la antena conviene localizar la causa.'],
 ['amplificacion','Amplificadores y antenas colectivas','Varios vecinos pierden señal a la vez o algunas tomas funcionan y otras no.','Indica cuántas viviendas o plantas están afectadas y si la avería comenzó después de una intervención. Coordina el acceso a los elementos comunes con la comunidad.','Se revisan alimentación, fuente, cabecera, amplificadores y distribución según la instalación. Más ganancia no siempre mejora la recepción: también hay que descartar saturación y pérdidas en cableado o derivadores.'],
 ['porteros','Reparación de porteros automáticos','El telefonillo no llama, el audio falla en un sentido o la puerta no abre.','Describe por separado llamada, conversación y apertura; confirma si falla un solo piso o todo el portal. Facilita marca y modelo visibles sin abrir el terminal.','Se comprueban terminal, placa, alimentación, conexiones y abrepuertas según el síntoma. Antes de sustituir un telefonillo se verifica su compatibilidad: un equipo aparentemente similar puede utilizar otro sistema.'],
 ['videoporteros','Instalación y reparación de videoporteros','No aparece imagen, el monitor se reinicia o quieres sustituir un telefonillo por vídeo.','Indica si es una vivienda individual o una comunidad, número de accesos y monitores y qué equipos existen. Una fotografía exterior del monitor y la placa ayuda a identificar el sistema.','La propuesta depende de la compatibilidad entre placa, monitor, alimentación y cableado. En comunidades, la renovación de un monitor y la del sistema completo tienen alcances diferentes; se concretan antes de elegir material.'],
 ['parabolicas','Instalación y ajuste de parabólicas','El receptor pierde señal por satélite o quieres instalar una nueva parabólica.','Indica qué receptor utilizas, si falla una o varias salidas y si existe una instalación previa. No subas al tejado ni muevas la antena para probar.','La revisión puede incluir orientación, fijación, LNB, conectores, cableado y configuración del receptor. Se diferencia una avería del equipo de recepción de un problema de instalación antes de proponer recambios.'],
 ['tomas','Tomas y cableado de televisión','La televisión funciona en una habitación y falla en otra, o necesitas un nuevo punto.','Indica cuántas tomas hay, cuáles fallan y si el recorrido del cable es accesible. Para una ampliación, explica dónde quieres colocar los televisores.','Se valora continuidad del coaxial, conectores, repartidores, derivadores y tipo de toma. Añadir una salida puede alterar el reparto de señal; el presupuesto debe concretar recorrido, materiales y comprobación final.']
];
export function serviceBlock(name,province,provinceRoute,isProvince=false){
 const cards=services.map(([id,title,symptom,intake,check])=>{
  return `<details id="revision-${id}" class="local-depth-card"><summary>${escape(title)}${isProvince?'':' en '+escape(name)}</summary><p><strong>Qué ocurre:</strong> ${escape(symptom)}</p><p><strong>Antes de pedir asistencia:</strong> ${escape(intake)}</p><p><strong>Qué se valora:</strong> ${escape(check)}</p><a href="#contacto" data-contact-service="${escape(id)}">Consultar ${escape(title.toLowerCase())} en ${escape(isProvince?province:name)} →</a>${isProvince?'':`<p><a href="${provinceRoute}#revision-${id}">Ver orientación de este servicio en ${escape(province)}</a></p>`}</details>`;
 }).join('');
 return `<section class="section wrap local-service-depth" data-local-service-depth="20261017" aria-labelledby="local-depth-title"><span class="eyebrow">Viviendas y comunidades</span><h2 id="local-depth-title">Antenas, porteros y videoporteros en ${escape(isProvince?province:name)}</h2><p>Elige el problema de tu instalación${isProvince?'':` en ${escape(name)}`} para preparar el aviso. La disponibilidad, el desplazamiento y el alcance del trabajo se confirman antes de organizar la visita.</p><div class="local-depth-grid">${cards}</div><h3>Qué concretar en el presupuesto</h3><p>Consulta si el diagnóstico y el desplazamiento tienen coste, qué materiales incluye la propuesta y si se aprovecha el cableado existente. En una comunidad, indica quién autoriza la intervención y facilita el acceso a las zonas comunes. La comprobación final debe corresponder al trabajo acordado: recepción en las tomas afectadas o llamada, audio, imagen y apertura, según el servicio.</p>${isProvince?'<a href="#localidades">Elegir municipio y consultar el servicio →</a>':`<a href="${provinceRoute}#localidades">Consultar otros municipios de ${escape(province)} →</a>`}</section>`;
}
const css='<style>.local-depth-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:24px 0}.local-depth-card{min-width:0;border:1px solid #d7dce2;border-radius:12px;padding:18px;background:#fff}.local-depth-card summary{cursor:pointer;font-weight:750;font-size:19px;line-height:1.4;min-height:44px}.local-depth-card p{line-height:1.65}.local-depth-card a{display:inline-block;min-height:44px;padding:10px 0;overflow-wrap:anywhere}.local-depth-card summary:focus-visible{outline:3px solid #2276b9;outline-offset:4px}@media(max-width:720px){.local-depth-grid{grid-template-columns:1fr}.local-depth-card{padding:16px}}</style>';
export function enhance(html,name,province,provinceRoute,isProvince=false){
 if(html.includes('data-local-service-depth="20261017"'))return html;
 const marker='<section class="section wrap faq"';
 assert(html.includes(marker),`${name}: falta ubicación FAQ`);
 return html.replace(marker,serviceBlock(name,province,provinceRoute,isProvince)+css+marker);
}
export function apply(root='dist'){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
 let count=0;
 for(const [province,total] of [['Bizkaia',113],['Burgos',371]]){
  const towns=manifest.filter(p=>p.province===province);assert.equal(towns.length,total);
  const route=`/Antenas-${province}/`,publicRoute=canonicalPath(route);
  for(const town of towns){
   const file=path.join(root,town.path.slice(1));let h=fs.readFileSync(file,'utf8');
   const before=h.match(/<link rel="canonical"[^>]+>/)?.[0];
   h=enhance(h,town.name,province,route);assert.equal(h.match(/<link rel="canonical"[^>]+>/)?.[0],before);
   assert.equal((h.match(/class="local-depth-card"/g)||[]).length,6);fs.writeFileSync(file,h);count++;
  }
  const file=path.join(root,route.slice(1),'index.html');fs.writeFileSync(file,enhance(fs.readFileSync(file,'utf8'),province,province,route,true));
 }
 console.log(`SERVICIOS LOCALES OK: ${count} municipios, ${count*6} consultas por servicio, dos guías provinciales.`);
 return count;
}
export function audit(root='dist'){
 const routes=publicRouteMap(root);
 const towns=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8')).filter(p=>['Bizkaia','Burgos'].includes(p.province));
 assert.equal(towns.length,484);
 for(const town of towns){
  const route=canonicalPath(town.path),h=fs.readFileSync(routes.get(route),'utf8');
  assert(h.includes('data-local-service-depth="20261017"'),route+': falta contenido');
  assert.equal((h.match(/class="local-depth-card"/g)||[]).length,6,route);
  for(const [id] of services){
   const destination=canonicalPath('/Antenas-'+town.province+'/');
   assert(h.includes(destination+'#revision-'+id),route+': falta enlace de servicio');
   assert(fs.readFileSync(routes.get(destination),'utf8').includes('id="revision-'+id+'"'));
  }
 }
 console.log('AUDITORÍA LOCAL OK: 484 fichas con seis servicios y destinos provinciales válidos.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 if(process.argv.includes('--audit'))audit();else apply();
}
