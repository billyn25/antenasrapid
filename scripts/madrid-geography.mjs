import data from '../content/madrid-geography.json' with {type:'json'};
import assert from 'node:assert/strict';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const industrialZone=/industrial|pol[ií]gono|log[ií]stic|empresarial|diseminado/i;
export function validateMadridGeography(snapshot=data){
 assert.equal(snapshot.municipalities.length,179,'Madrid: cobertura incompleta');
 assert.equal(new Set(snapshot.municipalities.map(row=>row.id)).size,179,'Madrid: municipios duplicados');
 for(const row of snapshot.municipalities){
  assert.match(row.id,/^28\d{3}$/);assert(row.name&&row.groups.length,row.name+': sin zonas documentadas');
  assert.equal(new Set(row.groups.map(g=>g.name)).size,row.groups.length,row.name+': zonas repetidas');
  for(const group of row.groups){
   assert(group.name&&!industrialZone.test(group.name),row.name+': zona industrial en el bloque residencial');
   assert(group.streets.length>0&&group.streets.length<=8,row.name+': selección de calles inválida');
   assert.equal(new Set(group.streets).size,group.streets.length,row.name+': calles repetidas en '+group.name);
   assert(group.sectorCodes?.length||group.sources?.length,row.name+': sin fuente de asignación');
   for(const code of group.sectorCodes||[])assert.match(code,new RegExp('^'+row.id.slice(2)+'\\d{7}$'),row.name+': sector de otro municipio');
  }
 }
 return snapshot;
}
const lookup=new Map(validateMadridGeography().municipalities.map(row=>[row.id,row]));
function zoneContent(group,open=false){
 return `<details class="madrid-zone"${open?' open':''}><summary>${esc(group.name)}</summary><p><strong>Calles de referencia:</strong> ${group.streets.map(esc).join(' · ')}.</p></details>`;
}
export function madridGeographyContent(id){
 const row=lookup.get(id);if(!row)return '';
 const first=row.groups.slice(0,6),rest=row.groups.slice(6);
 const municipalSources=[...new Set(row.groups.flatMap(g=>g.sources||[]))];
 const referenceSource=row.method==='spatial'?'Límites oficiales de barrios o núcleos y callejero regional':`<a href="${esc('https://gestiona.comunidad.madrid/nomenclator/ListadoTramMunicNomenclator.icm?ano=03%2F12%2F2025&codMunic='+id.slice(2))}">Nomenclátor y tramero de la Comunidad de Madrid</a>`;
 return `<div class="madrid-local-geography" data-madrid-geography="20261024-residential" data-municipality-id="${esc(id)}"><h3>Barrios y zonas para situar tu aviso</h3><p>Abre tu zona para consultar algunas calles de referencia. Para revisar una antena, un portero o un videoportero, indica también el número de portal y si el problema afecta a una vivienda o a varios vecinos.</p><div class="madrid-zone-list">${first.map(g=>zoneContent(g,row.groups.length===1)).join('')}</div>${rest.length?`<details class="madrid-more-zones"><summary>Ver otras ${rest.length} zonas de ${esc(row.name)}</summary><div class="madrid-zone-list">${rest.map(g=>zoneContent(g)).join('')}</div></details>`:''}<p class="postal-help">Una calle puede atravesar varias zonas. Los códigos postales se muestran para el municipio; confirma el correspondiente a tu calle y número.</p><details class="madrid-geography-sources"><summary>Fuentes de las referencias locales</summary><p class="postal-source">Zonas y tramos: ${referenceSource}${row.method==='spatial'?'':', referencia '+esc(data.reference)}. Selección de vías contrastada con el callejero y los usos residenciales del planeamiento de <a href="https://www.comunidad.madrid/geoportal/idem">IDEM · Comunidad de Madrid</a>, CC BY 4.0${municipalSources.map((url,i)=>`; <a href="${esc(url)}">fuente de zonas ${i+1}</a>`).join('')}. Consulta: ${esc(data.checkedOn)}. Se utilizan barrios, urbanizaciones y zonas de referencia, sin equipararlos todos a divisiones administrativas.</p></details></div>`;
}
