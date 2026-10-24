import data from '../content/madrid-geography.json' with {type:'json'};
import assert from 'node:assert/strict';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateMadridGeography(snapshot=data){
 assert.equal(snapshot.municipalities.length,179);
 assert.equal(new Set(snapshot.municipalities.map(row=>row.id)).size,179);
 for(const row of snapshot.municipalities){assert.match(row.id,/^28\d{3}$/);assert(row.name&&row.areas.length,row.name);for(const key of ['areas','streets','neighborhoods','localZones'])assert.equal(new Set(row[key]).size,row[key].length,row.name+': '+key);assert(row.streets.length>0&&row.streets.length<=40,row.name);if(row.neighborhoods.length)assert(row.sources.length);}
 return snapshot;
}
const lookup=new Map(validateMadridGeography().municipalities.map(row=>[row.id,row]));
const list=items=>items.map(esc).join(' · ');
export function madridGeographyContent(id){
 const row=lookup.get(id);if(!row)return '';
 const areas=row.areas.length>8?`<p>${list(row.areas.slice(0,8))}.</p><details><summary>Ver los ${row.areas.length} núcleos de referencia</summary><p>${list(row.areas)}.</p></details>`:`<p>${list(row.areas)}.</p>`;
 const zoneList=row.localZones.slice(0,8);
 const zones=row.localZones.length?`<h3>Barrios, colonias y urbanizaciones de referencia</h3><p>${list(zoneList)}.</p>${row.localZones.length>8?`<details><summary>Ver las ${row.localZones.length} zonas del callejero</summary><p>${list(row.localZones)}.</p></details>`:''}`:'';
 const streets=`<p>${list(row.streets.slice(0,6))}.</p>${row.streets.length>6?`<details class="madrid-street-details"><summary>Ver más calles de ${esc(row.name)} (${row.streets.length-6})</summary><p>${list(row.streets.slice(6))}.</p></details>`:''}`;
 const neighborhoods=`<p>${list(row.neighborhoods.slice(0,8))}.</p>${row.neighborhoods.length>8?`<details><summary>Ver más barrios y zonas de ${esc(row.name)}</summary><p>${list(row.neighborhoods.slice(8))}.</p></details>`:''}`;
 const sourceLinks=row.sources.map((url,i)=>`<a href="${esc(url)}">Fuente municipal ${i+1}</a>`).join(' · ');
 return `<div class="madrid-local-geography" data-madrid-geography="20261024-expanded" data-municipality-id="${esc(id)}">${row.neighborhoods.length?`<h3>${esc(row.zoneLabel||'Barrios conocidos de referencia')}</h3>${neighborhoods}`:''}${zones}<h3>Núcleos de población del municipio</h3>${areas}${row.streets.length?`<h3>Calles y vías de referencia</h3>${streets}<p>Son referencias para situar la instalación, no un callejero completo. Indica el número de portal: los códigos postales anteriores corresponden al municipio y no se asignan automáticamente a cada calle o barrio.</p>`:''}<p class="postal-source">Núcleos: <a href="https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&amp;cid=1254736177010&amp;idp=1254735572981&amp;menu=resultados">INE · Nomenclátor, referencia 01/01/2025</a>${row.streets.length?'; vías y zonas: <a href="https://idem.comunidad.madrid/catalogocartografia/srv/resources/datasets/spacm_callescm">Callejero de la Comunidad de Madrid (IDEM), CC BY 4.0</a>, CartoCiudad y fuentes municipales':''}${sourceLinks?'; '+sourceLinks:''}. Consulta: ${esc(data.checkedOn)}. Las referencias ubican el aviso; no representan oficinas ni intervenciones realizadas.</p></div>`;
}
