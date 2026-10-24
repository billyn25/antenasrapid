import data from '../content/madrid-geography.json' with {type:'json'};
import assert from 'node:assert/strict';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateMadridGeography(snapshot=data){
 assert.equal(snapshot.municipalities.length,179);
 assert.equal(new Set(snapshot.municipalities.map(row=>row.id)).size,179);
 for(const row of snapshot.municipalities){assert.match(row.id,/^28\d{3}$/);assert(row.name&&row.areas.length,row.name);for(const key of ['areas','streets','neighborhoods'])assert.equal(new Set(row[key]).size,row[key].length,row.name+': '+key);assert(row.streets.length<=8);if(row.neighborhoods.length)assert(row.sources.length);}
 return snapshot;
}
const lookup=new Map(validateMadridGeography().municipalities.map(row=>[row.id,row]));
const list=items=>items.map(esc).join(' · ');
export function madridGeographyContent(id){
 const row=lookup.get(id);if(!row)return '';
 const areas=row.areas.length>8?`<p>${list(row.areas.slice(0,8))}.</p><details><summary>Ver los ${row.areas.length} núcleos de referencia</summary><p>${list(row.areas)}.</p></details>`:`<p>${list(row.areas)}.</p>`;
 const sourceLinks=row.sources.map((url,i)=>`<a href="${esc(url)}">Fuente municipal ${i+1}</a>`).join(' · ');
 return `<div class="madrid-local-geography" data-madrid-geography="20261024" data-municipality-id="${esc(id)}">${row.neighborhoods.length?`<h3>${esc(row.zoneLabel||'Barrios conocidos de referencia')}</h3><p>${list(row.neighborhoods)}.</p>`:''}<h3>Núcleos de población del municipio</h3>${areas}${row.streets.length?`<h3>Calles y vías de referencia</h3><p>${list(row.streets)}.</p><p>Son referencias para situar la instalación, no un callejero completo. Indica el número de portal: los códigos postales anteriores corresponden al municipio y no se asignan automáticamente a cada calle o barrio.</p>`:''}<p class="postal-source">Núcleos: <a href="https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&amp;cid=1254736177010&amp;idp=1254735572981&amp;menu=resultados">INE · Nomenclátor, referencia 01/01/2025</a>${row.streets.length?'; vías: CartoCiudad (IGN/CNIG), selección de direcciones consultadas y fuentes municipales':''}${sourceLinks?'; '+sourceLinks:''}. Consulta: ${esc(data.checkedOn)}. Las referencias ubican el aviso; no representan oficinas ni intervenciones realizadas.</p></div>`;
}
