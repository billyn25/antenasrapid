import test from 'node:test';
import assert from 'node:assert/strict';
import {technicalBlock,diversifyPage,localCase} from '../scripts/technical-services.mjs';
test('soluciones técnicas: modelos, modulación y reemisores con intervención coordinada',()=>{
 const html=technicalBlock('La Villa','/villa');
 assert.equal((html.match(/<article>/g)||[]).length,7);
 const corpus=Array.from({length:100},(_,i)=>technicalBlock('Villa','/villa-'+i)).join('');
 for(const term of ['Televés','BOSS','Fagor Rhombus','EK BLUE','COFDM','titular o responsable autorizado','diferenciales','mirillas','TV LED','Wi-Fi lento','cortocircuitos'])assert(corpus.includes(term));
 assert(!html.includes('sede física'));
 assert(technicalBlock('<Villa>','/villa').includes('&lt;Villa&gt;'));
});
test('la variedad cambia los trabajos adicionales y mantiene los servicios solicitados',()=>{
 const combinations=new Set();
 for(let i=0;i<500;i++){
  const html=technicalBlock('Pueblo',`/Antenas-Burgos/pueblo-${i}.html`);
  combinations.add([...html.split('<div class="technical-grid">')[1].split('<div class="technical-case"')[0].matchAll(/<h3>(.*?)<\/h3>/g)].map(m=>m[1]).sort().join('|'));
 }
 assert(combinations.size>=450,`${combinations.size} combinaciones de trabajos`);
 assert.equal((technicalBlock('','/',true).match(/<article>/g)||[]).length,20);
});

test('casos y preguntas varían y las nueve tarjetas conservan anclas y enlaces',async()=>{
 const {renderPage,pages}=await import('../scripts/build.mjs');
 const original=renderPage(pages.find(p=>p.type==='town'));
 const a=diversifyPage(original,'Villa','/villa-a'),b=diversifyPage(original,'Villa','/villa-b');
 assert.notEqual(a,b);
 assert.equal((a.match(/class="service-card"/g)||[]).length,9);
 assert.equal((a.match(/id="preguntas"/g)||[]).length,1);
 assert.equal((a.match(/<details>/g)||[]).length,(original.match(/<details>/g)||[]).length-1);
 assert.equal(a.match(/<link rel="canonical"[^>]+>/)[0],original.match(/<link rel="canonical"[^>]+>/)[0]);
 assert.equal(a.match(/<h1>.*?<\/h1>/)[0],original.match(/<h1>.*?<\/h1>/)[0]);
 const cases=new Set(Array.from({length:100},(_,i)=>localCase('Villa','/caso-'+i).match(/data-case="(\d+)"/)[1]));
 assert.equal(cases.size,16);
});
