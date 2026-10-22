import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { moveNearbyToFooter, assertNearbyFooter, applyNearbyFooter } from '../scripts/nearby-footer.mjs';

const page = {path:'/Antenas-Segovia/segovia.html', name:'Segovia', province:'Segovia'};
const links = Array.from({length:6}, (_,i) => `<a href="/Antenas-Segovia/pueblo-${i}.html" data-nearby-ine="4000${i}" data-distance-km="${i+1}.0000"><span>Antenista en Pueblo ${i}</span><small>Segovia · ${i+1} km aprox.</small></a>`).join('');
const nearby = `<section class="related-towns-section geographic-neighbors" id="pueblos-cercanos" data-geographic-neighbors="ign-2025-v1"><div class="wrap"><div class="related-towns"><span class="eyebrow">Continúa por tu zona</span><h3>Localidades próximas a Segovia</h3><p>Páginas de antenista en municipios próximos con información de sus servicios. Puedes consultar otra localidad si la instalación está allí.</p><div class="related-town-links">${links}</div><p class="distance-note">Distancias en línea recta entre referencias municipales del IGN.</p><nav class="province-neighbor-nav"><a href="/Antenas-Segovia/anterior.html" data-ring-ine="40998">Anterior</a><a href="/Antenas-Segovia/siguiente.html" data-ring-ine="40999">Siguiente</a></nav></div></div></section>`;
const contact = '<section class="section wrap home-contact" id="contacto"><form data-whatsapp-form hidden><select name="province"><option value="segovia" selected>Segovia</option></select><input name="locality" value="Segovia"><button>Continuar en WhatsApp</button></form></section>';
const meta = '<title>Antenista en Segovia</title><meta name="description" content="Servicio en Segovia"><link rel="canonical" href="https://www.antenasrapid.com/antenas-segovia/segovia"><script type="application/ld+json">{"name":"Segovia"}</script>';
const footer = '<footer class="footer">Contactos por zonas</footer><div class="mobilebar">Llamar · WhatsApp</div>';
const html = `<html><head>${meta}</head><body><header>Marca</header><main id="contenido"><h1>Antenista en Segovia</h1>${nearby}<section id="preguntas">Preguntas</section>${contact}</main>${footer}</body></html>`;

test('cercanos cierra el contenido después del formulario y antes del pie', () => {
  const result = moveNearbyToFooter(html, page);
  assertNearbyFooter(result);
  assert(result.indexOf('id="preguntas"') < result.indexOf('id="contacto"'));
  assert(result.indexOf('id="contacto"') < result.indexOf('id="pueblos-cercanos"'));
  assert(result.includes('</section></main><footer'));
  assert.equal((result.match(/id="pueblos-cercanos"/g) || []).length, 1);
});

test('conserva destinos, distancias, anillo, formulario, metadatos y pie', () => {
  const result = moveNearbyToFooter(html, page);
  assert(result.includes(links));
  assert(result.includes('data-ring-ine="40998"'));
  assert(result.includes('data-ring-ine="40999"'));
  assert(result.includes(contact));
  assert(result.includes(meta));
  assert(result.includes(footer));
  assert(result.includes('href="/Antenas-Segovia/#localidades"'));
});

test('aplicación idempotente: no duplica sección, CSS ni enlace provincial', () => {
  const first = moveNearbyToFooter(html, page);
  assert.equal(moveNearbyToFooter(first, page), first);
  assert.equal((first.match(/nearby-footer\.css/g) || []).length, 1);
  assert.equal((first.match(/class="nearby-all"/g) || []).length, 1);
});

test('protege estructura incompleta, duplicados y rutas ajenas', () => {
  for (const broken of [html.replace(nearby,''), html.replace(nearby,nearby+nearby), html.replace(contact,''), html.replace('</main>',''), html.replace(footer,'')]) {
    assert.throws(() => moveNearbyToFooter(broken, page));
  }
  assert.throws(() => moveNearbyToFooter(html,{...page,path:'/../../index.html'}));
  assert.throws(() => assertNearbyFooter(html));
});

test('escapa nombres y conserva el destino de cada provincia', () => {
  const result = moveNearbyToFooter(html,{path:'/Antenas-Alava/pueblo.html',name:'Pueblo & "otro"',province:'Álava'});
  assert(result.includes('Pueblo &amp; &quot;otro&quot;'));
  assert(result.includes('href="/Antenas-Alava/#localidades"'));
  assert(result.includes('Ver todos los municipios de Álava'));
});

test('dos columnas móviles sin reglas que vuelvan a una sola', () => {
  const css = fs.readFileSync(new URL('../src/nearby-footer.css', import.meta.url),'utf8');
  assert(css.includes('repeat(2,minmax(0,1fr))'));
  assert(css.includes('grid-auto-rows:1fr'));
  assert(!css.includes('grid-template-columns:1fr'));
});

test('el build procesa todo el inventario y permite auditar la salida', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'rapid-nearby-'));
  try {
    fs.mkdirSync(path.join(root,'Antenas-Segovia'),{recursive:true});
    fs.mkdirSync(path.join(root,'assets'));
    fs.writeFileSync(path.join(root,'local-pages-manifest.json'), JSON.stringify([page]));
    fs.writeFileSync(path.join(root,page.path.slice(1)),html);
    assert.equal(applyNearbyFooter(root),1);
    assert.equal(applyNearbyFooter(root,true),1);
    const final = fs.readFileSync(path.join(root,page.path.slice(1)),'utf8');
    assertNearbyFooter(final);
    fs.writeFileSync(path.join(root,page.path.slice(1)),html);
    assert.throws(() => applyNearbyFooter(root,true));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
