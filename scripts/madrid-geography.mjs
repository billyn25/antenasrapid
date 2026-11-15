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
 return `<div class="madrid-local-geography" data-madrid-geography="20261024-residential" data-municipality-id="${esc(id)}"><h3>Barrios y zonas para situar tu aviso</h3><p>Indica tu calle y número de portal al contactar.</p><div class="madrid-zone-list">${first.map(g=>zoneContent(g,row.groups.length===1)).join('')}</div>${rest.length?`<details class="madrid-more-zones"><summary>Ver otras ${rest.length} zonas de ${esc(row.name)}</summary><div class="madrid-zone-list">${rest.map(g=>zoneContent(g)).join('')}</div></details>`:''}</div>`;
}
