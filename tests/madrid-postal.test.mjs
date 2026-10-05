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

test('el bloque postal conserva la sección FAQ completa, sus estilos y su ancla en todos los municipios',()=>{
 const data=load();
 for(const row of data.municipalities){
  const page={path:`/Antenas-Madrid/prueba-${row.id}.html`,name:row.name};
  const faq='<section class="section wrap faq" id="preguntas"><span class="eyebrow">Antes de llamar</span><h2>Preguntas prácticas</h2><details><summary>¿Qué datos facilito?</summary><p>Localidad y tipo de instalación.</p></details></section>';
  const contact='<section class="section wrap" id="contacto"><a href="tel:+34641589394">Llamar 641 589 394</a></section>';
  const html=`<html><head><title>Se conserva</title></head><body><main>${faq}${contact}</main></body></html>`;
  const updated=enrichMadridTown(html,page,row,data);
  assert.ok(updated.includes(faq),`${row.name}: se ha perdido el contenedor o el contenido de preguntas`);
  assert.equal((updated.match(/id="preguntas"/g)||[]).length,1);
  assert.equal((updated.match(/<section\b/g)||[]).length,(updated.match(/<\/section>/g)||[]).length);
  assert.equal(updated.replace(postalBlock(page,row,data),'').replace('<link rel="stylesheet" href="/assets/madrid-postal.css">',''),html,`${row.name}: la inserción postal altera el HTML anterior`);
 }
});
