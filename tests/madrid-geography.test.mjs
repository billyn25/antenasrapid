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
