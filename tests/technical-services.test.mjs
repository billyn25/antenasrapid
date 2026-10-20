import test from 'node:test';
import assert from 'node:assert/strict';
import {technicalBlock} from '../scripts/technical-services.mjs';
test('soluciones técnicas: modelos, modulación y reemisores con intervención coordinada',()=>{
 const html=technicalBlock('La Villa','/villa');
 assert.equal((html.match(/<article>/g)||[]).length,7);
 for(const term of ['Televés','BOSS','Fagor Rhombus','EK BLUE','COFDM','titular o responsable autorizado'])assert(html.includes(term));
 assert(!html.includes('sede física'));
 assert(technicalBlock('<Villa>','/villa').includes('&lt;Villa&gt;'));
});
test('la variedad cambia los trabajos adicionales y mantiene los servicios solicitados',()=>{
 const combinations=new Set();
 for(let i=0;i<500;i++){
  const html=technicalBlock('Pueblo',`/Antenas-Burgos/pueblo-${i}.html`);
  combinations.add([...html.matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]).slice(4).sort().join('|'));
 }
 assert(combinations.size>=40,`${combinations.size} combinaciones de trabajos`);
 assert.equal((technicalBlock('','/',true).match(/<article>/g)||[]).length,12);
});
