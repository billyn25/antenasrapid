import test from 'node:test';
import assert from 'node:assert/strict';
import {renderCommunityPage,linkCommunityService} from '../scripts/communities.mjs';

test('La página de comunidades conserva casos, estados y destinos reales',()=>{
 const html=renderCommunityPage('<header><a href="#porteros-videoporteros">Porteros</a><a href="#cobertura-movil">Cobertura</a><a href="#contacto">Contacto</a></header>');
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.match(html,/href="\/#porteros-videoporteros"/);
 assert.match(html,/href="\/#cobertura-movil"/);
 assert.match(html,/valoracion-videoportero-getxo/);
 assert.match(html,/Valoración para sustituir/);
 assert.match(html,/cambio-a-videoportero-llodio-antes/);
 assert.match(html,/cambio-a-videoportero-llodio-despues/);
 assert.match(html,/torrejon-de-ardoz\.html#galeria/);
 assert.match(html,/href="\/Antenas-Madrid\/madrid\.html#comunidades"/);
 for(const id of ['amplificacion','porteros','videoporteros','accesos','mantenimiento']){
  assert(html.includes(`data-contact-service="${id}"`));
  assert(html.includes(`<option value="${id}">`));
 }
 for(const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(match[1]));
});
test('El enlace local es único y mantiene el contenido de la ficha',()=>{
 const original='<main><h1>Antenista en Bilbao</h1><section id="porteros-videoporteros"><h2>Porteros</h2><p class="section-lead">Texto existente</p><article>Detalle del servicio</article></section></main>';
 const once=linkCommunityService(original);
 assert.equal(linkCommunityService(once),once);
 assert.match(once,/<h1>Antenista en Bilbao<\/h1>/);
 assert.match(once,/<article>Detalle del servicio<\/article>/);
 assert.equal((once.match(/href="\/comunidades-de-vecinos\/"/g)||[]).length,1);
});
