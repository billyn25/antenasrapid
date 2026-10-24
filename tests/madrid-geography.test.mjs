import test from 'node:test';import assert from 'node:assert/strict';
import {validateMadridGeography,madridGeographyContent} from '../scripts/madrid-geography.mjs';
test('los 179 municipios tienen núcleos y solo aparecen las vías y barrios documentados',()=>{
 const data=validateMadridGeography();
 for(const row of data.municipalities){const h=madridGeographyContent(row.id);assert(h.includes(`data-municipality-id="${row.id}"`));assert(h.includes('Núcleos de población'));assert.equal(h.includes('Calles y vías de referencia'),Boolean(row.streets.length));assert.equal(h.includes(row.zoneLabel||'Barrios conocidos de referencia'),Boolean(row.neighborhoods.length));}
 assert.equal(madridGeographyContent('09001'),'');
});
test('los barrios conocidos de Getafe y Torrejón mantienen su municipio',()=>{
 const getafe=madridGeographyContent('28065'),torrejon=madridGeographyContent('28148');
 assert(getafe.includes('Juan de la Cierva')&&getafe.includes('Sector III'));assert(!getafe.includes('Soto Henares'));
 assert(torrejon.includes('Soto Henares')&&torrejon.includes('Parque Cataluña'));assert(!torrejon.includes('Juan de la Cierva'));
});
test('las referencias reconocibles preceden al resto y las listas ampliadas se despliegan',()=>{
 const alcala=madridGeographyContent('28005'),coslada=madridGeographyContent('28049'),rozas=madridGeographyContent('28127');
 assert(alcala.indexOf('Calle Mayor')<alcala.indexOf('Ver más calles'));
 assert(coslada.includes('Ciudad 70')&&coslada.includes('Valleaguado Norte'));
 assert(rozas.includes('El Cantizal')&&rozas.includes('Las Matas'));
 for(const row of validateMadridGeography().municipalities){
  const h=madridGeographyContent(row.id);
  assert.equal(h.includes('madrid-street-details'),row.streets.length>6);
  for(const street of row.streets)assert.equal((h.match(/<p>([^<]*)<\/p>/g)||[]).flatMap(p=>p.slice(3,-4).replace(/\.$/,'').split(' · ')).filter(x=>x===street.replaceAll('&','&amp;')).length,1,`${row.name}: ${street}`);
 }
});
