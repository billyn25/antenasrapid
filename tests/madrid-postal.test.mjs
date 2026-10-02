import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatePostalData,postalBlock,enrichMadridTown} from '../scripts/madrid-postal.mjs';
const load=()=>JSON.parse(fs.readFileSync('content/postal-codes-madrid.json','utf8'));
test('Madrid contiene 179 municipios y solo códigos postales contrastados',()=>validatePostalData(load()));
test('un código postal puede pertenecer a varios municipios sin perder relaciones',()=>{
 const rows=load().municipalities;const n=rows.reduce((n,r)=>n+r.postalCodes.length,0);
 assert.ok(n>new Set(rows.flatMap(r=>r.postalCodes)).size);
});
test('Madrid capital y provincia no se confunden y la lista no genera rutas por CP',()=>{
 const data=load(),row=data.municipalities.find(r=>r.id==='28079');
 const html=postalBlock({name:'Madrid'},row,data);
 assert.match(html,/<h2>Códigos postales de Madrid<\/h2>/);
 assert.ok(row.postalCodes.length>12);assert.match(html,/<details/);
 for(const code of row.postalCodes)assert.ok(html.includes(`>${code}</span>`));
 assert.ok(!/href="\/[0-9]{5}/.test(html));
});
test('no se modifican otras provincias ni los metadatos de las páginas de Madrid',()=>{
 const data=load(),row=data.municipalities.find(r=>r.id==='28005');
 const html='<html><head><title>Se conserva</title></head><body><h1>Antenista en Alcalá de Henares</h1><section class="section wrap faq" id="preguntas"></section></body></html>';
 assert.equal(enrichMadridTown(html,{path:'/Antenas-Burgos/lerma.html'},row,data),html);
 const updated=enrichMadridTown(html,{path:'/Antenas-Madrid/alcala-de-henares.html',name:'Alcalá de Henares'},row,data);
 assert.ok(updated.includes('<title>Se conserva</title>'));assert.equal((updated.match(/<h1>/g)||[]).length,1);
 assert.throws(()=>enrichMadridTown(updated,{path:'/Antenas-Madrid/alcala-de-henares.html'},row,data),/ya está/);
});
