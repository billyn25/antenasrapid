import test from 'node:test';
import assert from 'node:assert/strict';
import {orderTownSections,assertTownOrder} from '../scripts/town-section-order.mjs';
const page={name:'Prueba',province:'Burgos',path:'/Antenas-Burgos/prueba.html'};
const section=(id,body='')=>`<section class="section wrap" id="${id}"><h2>${id}</h2>${body}</section>`;
function fixture(){return `<html><head><link rel="stylesheet" href="/assets/nearby-footer.css?v=20261022"></head><body><header>Cabecera</header><main id="contenido"><section class="hero"><h1>Antenista en Prueba</h1><img src="/hero.jpg"></section>${section('servicios','<p>Servicios principales</p>')}${section('servicio-local','<p>Catálogo duplicado</p>')}${section('problemas-tdt')}${section('porteros-videoporteros')}${section('cobertura-movil')}${section('soluciones-tecnicas','<article><h3>Solución técnica</h3><p>Diagnóstico con medida de señal</p></article>')}<section class="section wrap local-service-depth"><h2 id="local-depth-title">Averías</h2><details><summary>La puerta no abre</summary><p>Comprobar la alimentación</p></details></section>${section('experiencia')}${section('contexto-municipal','<p>Indica la calle y el portal</p>')}${section('codigos-postales','<p>48001</p>')}${section('preguntas')}${section('contacto','<form data-whatsapp-form><label>Localidad<input name="locality"></label><button>Consultar</button></form>')}${section('zonas','<p>Consulta provincial repetida</p><a href="/Antenas-Burgos/">Provincia</a>')}<section class="related-towns-section" id="pueblos-cercanos"><div class="wrap">${Array.from({length:6},(_,i)=>`<a href="/pueblo-${i}" data-nearby-ine="0900${i}">Pueblo ${i}</a>`).join('')}<a class="nearby-all" href="/Antenas-Burgos/">Ver todos los municipios</a></div></section></main><footer>Pie</footer></body></html>`;}
test('la agrupación conserva diagnóstico, formulario, foto y cobertura; retira solo el catálogo redundante',()=>{
 const before=fixture(),after=orderTownSections(before,page);assertTownOrder(after,page);
 assert(!after.includes('Catálogo duplicado'));assert(!after.includes('Consulta provincial repetida'));
 for(const copy of ['Diagnóstico con medida de señal','La puerta no abre','Comprobar la alimentación','Indica la calle y el portal','48001','<img src="/hero.jpg">'])assert(after.includes(copy));
 assert(after.includes(before.match(/<form[\s\S]*?<\/form>/)[0]));
 assert(after.indexOf('local-service-depth')>after.indexOf('id="soluciones-tecnicas"'));
 assert(after.indexOf('id="contexto-municipal"')>after.indexOf('id="contacto"'));
 assert.equal((after.match(/id="contacto"/g)||[]).length,1);
 assert.equal((after.match(/class="nearby-all"/g)||[]).length,1);
 assert.equal(orderTownSections(after,page),after);
});
test('un diagnóstico dentro de un bloque mal cerrado no se publica',()=>{
 assert.throws(()=>orderTownSections(fixture().replace('</details>',''),page));
});
