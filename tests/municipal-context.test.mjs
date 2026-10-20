import test from 'node:test';
import assert from 'node:assert/strict';
import {distanceKm,municipality,nearestTowns,provinceRing,contextBlock,enhanceMunicipality} from '../scripts/municipal-context.mjs';
const towns=[{name:'Bilbao',province:'Bizkaia',municipioId:'48020',path:'/Antenas-Bizkaia/bilbao.html'},{name:'Barakaldo',province:'Bizkaia',municipioId:'48013',path:'/Antenas-Bizkaia/barakaldo.html'},{name:'Getxo',province:'Bizkaia',municipioId:'48044',path:'/Antenas-Bizkaia/getxo.html'}].map(municipality);
test('distancia geográfica y orden, sin depender del nombre ni enlaces a sí mismo',()=>{
 assert.equal(distanceKm(towns[0],towns[0]),0);
 assert(Math.abs(distanceKm(towns[0],towns[1])-distanceKm(towns[1],towns[0]))<1e-9);
 const nearest=nearestTowns(towns[0],towns,2);
 assert.equal(nearest[0].name,'Barakaldo');assert(nearest[0].distance>5&&nearest[0].distance<10);
 assert(!nearest.some(t=>t.municipioId===towns[0].municipioId));
 assert.equal(nearestTowns({...towns[0],name:'Otro nombre'},towns,2)[0].municipioId,'48013');
});
test('anillo provincial: cada localidad recibe enlaces de sus dos vecinos',()=>{
 for(const t of towns)assert.equal(towns.filter(p=>provinceRing(p,towns).some(x=>x.municipioId===t.municipioId)).length,2);
});
test('datos con fuente y fecha, sin presentar el padrón como actual ni inventar cobertura',()=>{
 const html=contextBlock(towns[0]);assert(html.includes('20/10/2025'));assert(html.includes('km²'));assert(html.includes('CC BY 4.0'));
 assert(html.includes('no son una estimación de población actual'));assert(!html.includes('llegamos en'));
 assert.throws(()=>municipality({municipioId:'99999',path:'/inventado'}));
});
test('sustitución conserva metadatos y elimina la segunda lista aleatoria',()=>{
 const h='<head><title>Título</title><meta name="description" content="Una descripción"><link rel="canonical" href="https://www.antenasrapid.com/antenas-bizkaia/bilbao"></head><h1>Bilbao</h1><section class="section soft"><div class="wrap two-col">Anterior</div></section><section class="related-towns-section">Anterior</section><div class="other-localities"><nav>Anterior</nav></div><div class="local-contact">Contacto</div>';
 const result=enhanceMunicipality(h,towns[0],nearestTowns(towns[0],towns,2),provinceRing(towns[0],towns));
 assert(result.includes('<title>Título</title>'));assert(result.includes('id="nearby-municipalities-schema"'));
 assert(!result.includes('class="other-localities"'));assert(result.includes('<div class="local-contact">Contacto</div>'));
 assert.equal(enhanceMunicipality(result,towns[0],[],[]),result);
});

test('los casos de porteros varían sin perder la sección ni el contacto',async()=>{
 const {localDoorphoneCases}=await import('../scripts/local-doorphone-cases.mjs');
 const source='<section class="doorphones section" id="porteros-videoporteros"><h2>Porteros en Bilbao</h2><a href="tel:+34641589394">Llamar</a><p class="section-lead">Anterior</p><div class="doorphone-work"><article>Anterior</article></div><p class="doorphone-note">Anterior</p></section>';
 const variants=new Set();
 for(let i=0;i<100;i++){
  const html=localDoorphoneCases(source,String(i));variants.add(html);
  assert.equal((html.match(/<article>/g)||[]).length,3);assert(html.includes('<h2>Porteros en Bilbao</h2>'));assert(html.includes('tel:+34641589394'));
 }
 assert(variants.size>=60);assert.equal(localDoorphoneCases(source,'48020'),localDoorphoneCases(source,'48020'));
});
