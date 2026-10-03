import test from 'node:test';
import assert from 'node:assert/strict';
import {MADRID_LINK_SERVICES,madridServiceIndexes,madridServiceLink,labelMadridHomeLinks,enrichMadridDirectory} from '../scripts/madrid-postal.mjs';
const locals=[{name:'Madrid',path:'/Antenas-Madrid/madrid.html',municipioId:'28079'},{name:'Alcalá de Henares',path:'/Antenas-Madrid/alcala-de-henares.html',municipioId:'28005'},{name:'Móstoles',path:'/Antenas-Madrid/mostoles.html',municipioId:'28092'}];
const indexes=madridServiceIndexes(locals);
const hrefs=h=>[...h.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>m[1]);
const other='<article class="featured-province"><h3><a href="/Antenas-Burgos/">Burgos</a></h3><a href="/Antenas-Burgos/lerma.html">Lerma</a></article>';
const card='<article class="featured-province"><h3><a href="/Antenas-Madrid/">Madrid</a></h3><div class="featured-towns"><a href="/Antenas-Madrid/madrid.html">Madrid</a><a href="/Antenas-Madrid/alcala-de-henares.html">Alcalá de Henares</a></div><details class="featured-more"><summary>Más pueblos con servicio</summary><div class="featured-more-links"><a href="/Antenas-Madrid/mostoles.html">Móstoles</a></div></details><a class="featured-all" href="/Antenas-Madrid/">Ver todos los pueblos →</a></article>';
const html='<html><head><title>Original</title></head><body>'+other+card+'</body></html>';
test('Madrid alterna los tres servicios con un espacio real antes del municipio',()=>{
  for(const [i,p] of locals.entries()){
    const s=madridServiceLink(p,indexes.get(p.path));
    assert.ok(s.includes(MADRID_LINK_SERVICES[i]+' en</span> <strong'));
    assert.ok(s.includes(p.name));assert.deepEqual(hrefs(s),[p.path]);
  }
});
test('portada: conserva destinos, pueblos, desplegable y otras provincias',()=>{
  const result=labelMadridHomeLinks(html,locals);
  assert.deepEqual(hrefs(result),hrefs(html));assert.ok(result.includes(other));
  assert.equal((result.match(/class="madrid-service-link"/g)||[]).length,3);
  assert.equal((result.match(/href="\/assets\/madrid-postal.css"/g)||[]).length,1);
  assert.ok(result.includes('<title>Original</title>'));assert.ok(result.includes('<details class="featured-more">'));
  assert.equal(labelMadridHomeLinks(result,locals),result);
  assert.equal(labelMadridHomeLinks(other,locals),other);
});
test('directorio: conserva búsqueda por nombre y código postal y todos los enlaces postales',()=>{
  const lookup=new Map(locals.map((p,i)=>[p.municipioId,{id:p.municipioId,postalCodes:i===0?['28001']:['28801']}]))
  const input='<html><head><title>Directorio</title></head><body><ul class="town-list">'+locals.map(p=>`<li data-town="${p.name}"><a href="${p.path}">${p.name} →</a></li>`).join('')+'</ul><section class="section wrap faq" id="preguntas"></section></body></html>';
  const result=enrichMadridDirectory(input,locals,lookup,{checkedOn:'2026-10-02'});
  for(const p of locals){
    assert.ok(result.includes(madridServiceLink(p,indexes.get(p.path))));
    assert.ok(result.includes(`data-town="${p.name} ${lookup.get(p.municipioId).postalCodes.join(' ')}"`));
    assert.ok(result.includes(`href="${p.path}#codigos-postales"`));
  }
  assert.equal((result.match(/data-postal-codes="28801"/g)||[]).length,2);
});
test('escapa nombres y rechaza destinos duplicados e índices ausentes',()=>{
  assert.ok(madridServiceLink({name:'"El Álamo" & <valle>',path:'/Antenas-Madrid/el-alamo.html'},0).includes('&quot;El Álamo&quot; &amp; &lt;valle&gt;'));
  assert.throws(()=>madridServiceIndexes([locals[0],locals[0]]),/duplicados/);
  assert.throws(()=>madridServiceLink(locals[0],undefined));
});
