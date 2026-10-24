import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMadridGeography,madridGeographyContent} from '../scripts/madrid-geography.mjs';
test('los 179 municipios agrupan calles en zonas documentadas sin sectores industriales',()=>{
 for(const row of validateMadridGeography().municipalities){
  const h=madridGeographyContent(row.id);
  assert(h.includes(`data-municipality-id="${row.id}"`));
  assert.equal((h.match(/class="madrid-zone"/g)||[]).length,row.groups.length);
  assert(!h.includes('Núcleos de población del municipio'));
  assert.equal(h.includes('madrid-more-zones'),row.groups.length>6);
 }
 assert.equal(madridGeographyContent('09001'),'');
});
test('Coslada y San Fernando conservan la selección residencial aprobada y retiran los polígonos',()=>{
 const data=validateMadridGeography();
 const coslada=data.municipalities.find(r=>r.id==='28049');
 const puerto=coslada.groups.find(g=>g.name==='Barrio del Puerto');
 assert(puerto.streets.includes('Calle Océano Pacífico'));
 assert(!puerto.streets.includes('Calle Méjico'));
 const h=madridGeographyContent('28049');
 for(const name of ['Fuentemar','Avenida de la Industria'])assert(!h.includes(name));
 const sanfer=data.municipalities.find(r=>r.id==='28130');
 assert(sanfer.groups.find(g=>g.name==='Parque Henares').streets.includes('Avenida de Zarauz'));
 const s=madridGeographyContent('28130');
 for(const name of ['Astronomía','Artesanos','Sistema Solar'])assert(!s.includes(name));
});
test('se rechaza una asignación de sector de otro municipio o una zona industrial',()=>{
 const d=structuredClone(validateMadridGeography());
 d.municipalities[0].groups[0].sectorCodes=['0490101002'];
 assert.throws(()=>validateMadridGeography(d),/otro municipio/);
 const d2=structuredClone(validateMadridGeography());d2.municipalities[0].groups[0].name='Industrial Norte';
 assert.throws(()=>validateMadridGeography(d2),/industrial/);
});
