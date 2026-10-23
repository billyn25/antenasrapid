import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const version = '20261023';
const groups = [
  {name: 'Recepción y distribución de televisión', cards: [1,2,3,4,5,6,7,8,9,10,11,12,17,20]},
  {name: 'Accesos y apertura', cards: [15,16]},
  {name: 'Conectividad y cobertura', cards: [18,19]},
  {name: 'Electricidad', cards: [13,14]}
];
const styles = `<style id="home-section-order-style">
[data-home-order="${version}"] .technical-group{margin-top:32px}
[data-home-order="${version}"] .technical-group-title{font-size:clamp(22px,3vw,28px);line-height:1.3;margin:0 0 18px;padding-bottom:12px;border-bottom:1px solid var(--line);color:var(--ink)}
[data-home-order="${version}"] .technical-grid h4{font-size:21px;line-height:1.3;margin:0 0 12px;overflow-wrap:anywhere;color:var(--ink)}
@media(max-width:760px){[data-home-order="${version}"] .technical-group{margin-top:26px}}
</style>`;

// Keep each existing top-level node byte-for-byte, including nested sections,
// the service strip, gallery dialog and its styles.
function children(html) {
  const tags = /<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>/g;
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const stack = []; const nodes = []; let start = -1;
  for (const match of html.matchAll(tags)) {
    if (match[0].startsWith('<!--')) continue;
    const name = match[0].match(/^<\/?([a-z][\w:-]*)/i)?.[1].toLowerCase();
    if (!name) continue;
    if (match[0].startsWith('</')) {
      assert.equal(stack.pop(), name, `Portada: cierre desordenado de ${name}`);
      if (!stack.length) {nodes.push(html.slice(start, match.index + match[0].length)); start = -1;}
    } else {
      if (!stack.length) start = match.index;
      if (voidTags.has(name) || match[0].endsWith('/>')) {
        if (!stack.length) {nodes.push(match[0]); start = -1;}
      } else stack.push(name);
    }
  }
  assert.equal(stack.length, 0, 'Portada: quedan nodos sin cerrar');
  assert.equal(html.replace(/\s/g,''), nodes.join('').replace(/\s/g,''), 'Portada: contenido fuera de los bloques previstos');
  return nodes;
}

function groupTechnical(html) {
  const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m => m[0]);
  assert.equal(cards.length, 20, 'Portada: deben conservarse los veinte trabajos');
  const selected = groups.flatMap(g => g.cards);
  assert.deepEqual([...selected].sort((a,b) => a-b), Array.from({length:20}, (_,i) => i+1));
  const first = html.indexOf('<div class="technical-grid">');
  const last = html.lastIndexOf('</div>');
  assert.ok(first > 0 && last > first, 'Portada: rejilla técnica no reconocida');
  assert.equal(html.slice(first, last+6), '<div class="technical-grid">'+cards.join('')+'</div>', 'Portada: hay contenido técnico fuera de las tarjetas');
  const grouped = groups.map(group => `<div class="technical-group"><h3 class="technical-group-title">${group.name}</h3><div class="technical-grid">${group.cards.map(i => cards[i-1].replace(/<h3>/g,'<h4>').replace(/<\/h3>/g,'</h4>')).join('')}</div></div>`).join('');
  return html.slice(0, first) + grouped + html.slice(last+6);
}

function signature(html, expression) {return [...html.matchAll(expression)].map(m => m[0]).sort();}

export function orderHomeSections(html) {
  if (html.includes(`data-home-order="${version}"`)) return html;
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  assert.ok(main, 'Portada: falta el contenido principal');
  const nodes = children(main[1]);
  const byId = new Map(); const extras = {};
  for (const node of nodes) {
    const opening = node.slice(0,node.indexOf('>')+1);
    const id = opening.match(/\bid="([^"]+)"/)?.[1];
    if (id) {assert.ok(!byId.has(id)); byId.set(id,node);}
    else if (/^<section\b/.test(node) && /class="hero\b/.test(opening)) extras.hero = node;
    else if (/^<div class="strip"/.test(node)) extras.strip = node;
    else if (/^<style\b/.test(node)) extras.style = node;
    else if (/^<section\b/.test(node) && node.includes('Antes de cambiar equipos, revisamos la instalación.')) extras.preparation = node;
    else assert.fail('Portada: bloque desconocido; revisar antes de moverlo');
  }
  const take = id => {assert.ok(byId.has(id), `Portada: falta ${id}`); const value=byId.get(id); byId.delete(id); return value;};
  for (const name of ['hero','strip','style','preparation']) assert.ok(extras[name], `Portada: falta ${name}`);
  const ordered = [extras.hero,extras.strip,take('servicios'),take('zonas'),take('porteros-videoporteros'),take('cobertura-movil'),take('galeria'),take('gallery-lightbox'),take('experiencia'),extras.style,styles,groupTechnical(take('soluciones-tecnicas')),take('pueblos-destacados'),extras.preparation,take('preguntas'),take('contacto')];
  assert.equal(byId.size,0,'Portada: quedan bloques sin ubicar');
  const updated = html.replace(main[0],main[0].slice(0,main[0].indexOf('>')).concat(` data-home-order="${version}">`,ordered.join('\n'),'</main>'));
  // Reordering must not change metadata, assets, forms or the link inventory.
  for (const re of [/<a\b[^>]*>/g,/<img\b[^>]*>/g,/<meta\b[^>]*>/g,/<title>[\s\S]*?<\/title>/g,/<link\b[^>]*>/g,/<form\b[\s\S]*?<\/form>/g,/<script\b[\s\S]*?<\/script>/g]) assert.deepEqual(signature(updated,re),signature(html,re),'Portada: contenido protegido modificado');
  const originalCards = [...html.match(/<section\b[^>]*id="soluciones-tecnicas"[\s\S]*?<\/section>/)[0].matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]).sort();
  const resultCards = [...updated.match(/<section\b[^>]*id="soluciones-tecnicas"[\s\S]*?<\/section>/)[0].matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0].replace(/<h4>/g,'<h3>').replace(/<\/h4>/g,'</h3>')).sort();
  assert.deepEqual(resultCards,originalCards,'Portada: se ha perdido texto de un trabajo');
  return updated;
}

export function applyHomeOrder(root='dist') {
  const file = path.join(root,'index.html'); const before=fs.readFileSync(file,'utf8');
  const after=orderHomeSections(before);
  if (after!==before) fs.writeFileSync(file,after);
  console.log('PORTADA ORDENADA: 9 servicios, 20 trabajos agrupados y todos los textos, fotos, formularios y enlaces conservados.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) applyHomeOrder(process.env.PRODUCTION_ROOT||'dist');
