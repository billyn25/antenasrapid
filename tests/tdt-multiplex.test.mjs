import test from 'node:test';
import assert from 'node:assert/strict';
import {multiplexFor,renderMultiplex} from '../scripts/tdt-multiplex.mjs';
test('MUX respeta áreas técnicas, incluidas las que cruzan provincias',()=>{
 assert.deepEqual(multiplexFor('28079'),{area:'Madrid',mpe5:22,rge2:41});
 assert.deepEqual(multiplexFor('48020'),{area:'Bizkaia Oeste',mpe5:26,rge2:28});
 assert.deepEqual(multiplexFor('09114'),{area:'Burgos Norte',mpe5:30,rge2:37});
 assert.deepEqual(multiplexFor('01055'),{area:'Burgos Norte',mpe5:30,rge2:37});
 assert.equal(multiplexFor('01059').rge2,43);
});
test('Sintonización no asigna frecuencias a municipios desconocidos o franceses',()=>{
 assert.throws(()=>renderMultiplex({name:'Hendaya',municipioId:'FR64483'}));
 const html=renderMultiplex({name:'Bilbao',province:'Vizcaya',municipioId:'48020'});
 assert.match(html,/Canal UHF 26 · 514 MHz/);
 assert.match(html,/Canal UHF 28 · 530 MHz/);
 assert.match(html,/DVB-T2 y HEVC/);
});
