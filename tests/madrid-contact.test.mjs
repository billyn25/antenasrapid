import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {MADRID_CONTACT,CENTRAL_PROVINCES,isMadridPage,isCentralPage,replaceMadridContact,assertMadridContact,assertPageContact,assertRegionalFooter,rewriteRegionalPage,withoutFooter,applyMadridContact,auditMadridContact} from '../scripts/madrid-contact.mjs';
import districts from '../content/madrid-districts.json' with {type:'json'};
const sample=`<!doctype html><html><head><title>Antenista | 641 589 394</title><meta name="robots" content="index,follow"><meta name="description" content="Llamar 641 589 394"><link rel="canonical" href="https://www.antenasrapid.com/antenas-madrid/madrid"><script type="application/ld+json">{"@graph":[{"telephone":"+34641589394","provider":{"telephone":"+34641589394"}}]}</script></head><body><header><a href="tel:+34641589394">641 589 394</a></header><h1>Antenas</h1><a href="https://wa.me/34641589394?text=Llamar%20641%20589%20394">WhatsApp</a><footer><div><strong>Contacto</strong><p><a href="tel:+34641589394">641 589 394</a><br><a href="https://wa.me/34641589394">WhatsApp</a></p></div><p class="fine">Antenas Rapid · Propiedad de R.F.G. · 641 589 394</p></footer><div class="mobilebar"><a href="tel:+34641589394">641 589 394</a><a href="https://wa.me/34641589394">WhatsApp</a></div></body></html>`;
const stripStyle=h=>h.replace('<link rel="stylesheet" href="/assets/regional-contact.css?v=20261015">','');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'rapid-regional-contact-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const manifest=[];
 for(const p of CENTRAL_PROVINCES){
  const folder='Antenas-'+p.name;fs.mkdirSync(path.join(root,folder));
  const towns=Array.from({length:p.municipalities},(_,i)=>({path:`/${folder}/town-${i}.html`,seoDescription:p.name+' | 641 589 394'}));
  manifest.push(...towns);
  for(const name of ['index.html',...towns.map(p=>path.basename(p.path)),...(p.districts?districts.districts.map(d=>d.slug+'.html'):[])])fs.writeFileSync(path.join(root,folder,name),sample);
 }
 manifest.push({path:'/Antenas-Burgos/lerma.html',seoDescription:'Lerma | 641 589 394'});
 fs.writeFileSync(path.join(root,'local-pages-manifest.json'),JSON.stringify(manifest,null,2));
 fs.mkdirSync(path.join(root,'Antenas-Burgos'));fs.writeFileSync(path.join(root,'Antenas-Burgos/lerma.html'),sample);
 fs.writeFileSync(path.join(root,'index.html'),sample);fs.writeFileSync(path.join(root,'404.html'),'<h1>404</h1>');
 return root;
}
test('Contacto: Madrid, Guadalajara y Toledo; nunca Lugo ni provincias por coincidencia parcial',()=>{
 assert.deepEqual(MADRID_CONTACT,{phone:'614 78 99 45',tel:'+34614789945',whatsapp:'34614789945'});
 for(const route of ['/Antenas-Madrid/','Antenas-Toledo/index.html','/antenas-guadalajara/azuqueca-de-henares','/Antenas-Madrid/carabanchel.html'])assert.ok(isCentralPage(route));
 for(const route of ['/','/Antenas-Lugo/','/Antenas-Madrid-extra/','/Antenas-Salamanca/toledo.html',null])assert.equal(isCentralPage(route),false);
 assert.ok(isMadridPage('/Antenas-Madrid/'));assert.equal(isMadridPage('/Antenas-Toledo/'),false);
});
test('Contacto: metadatos, JSON-LD, llamada, WhatsApp y barra móvil usan el número de la zona',()=>{
 const updated=rewriteRegionalPage(sample,'/Antenas-Toledo/toledo.html');
 assert.deepEqual(assertMadridContact(updated),{calls:2,whatsapps:2,footerCalls:2,footerWhatsapps:2});
 assert.ok(updated.includes('Llamar%20614%2078%2099%2045'));
 assert.equal(stripStyle(withoutFooter(updated)),replaceMadridContact(withoutFooter(sample)));
 assert.equal(rewriteRegionalPage(updated,'/Antenas-Toledo/toledo.html'),updated);
});
test('Pie: ambos teléfonos etiquetados; el contacto norte no cambia fuera del pie',()=>{
 const updated=rewriteRegionalPage(sample,'/Antenas-Burgos/lerma.html');
 assertPageContact(updated,false);assertRegionalFooter(updated);
 assert.equal(stripStyle(withoutFooter(updated)),withoutFooter(sample));
 assert.ok(updated.includes('Madrid, Guadalajara y Toledo'));assert.ok(updated.includes('Zona norte y Castilla y León'));
 assert.equal((updated.match(/data-regional-contacts=/g)||[]).length,1);
});
test('Contacto: falla por teléfono antiguo fuera del pie, enlaces erróneos o schema corrupto',()=>{
 const updated=rewriteRegionalPage(sample,'/Antenas-Madrid/');
 assert.throws(()=>assertMadridContact(sample));
 for(const [from,to] of [['wa.me/34614789945','wa.me/34999999999'],['tel:+34614789945','tel:+34999999999'],['"telephone":"+34614789945"','"telephone":"+34999999999"'],['{"@graph"','BROKEN{"@graph"']])assert.throws(()=>assertMadridContact(updated.replace(from,to)));
 assert.throws(()=>assertRegionalFooter(updated.replace('>Zona norte y Castilla y León<','>Madrid<')));
 assert.throws(()=>assertRegionalFooter(updated.replace('tel:+34641589394','tel:+34614789945')));
});
test('Inventario: 695 páginas centrales, pies globales e idempotencia',t=>{
 const root=fixture(t),other=fs.readFileSync(path.join(root,'Antenas-Burgos/lerma.html'),'utf8');
 const result=applyMadridContact(root);
 assert.equal(result.centralPages,695);assert.deepEqual(result.byProvince,{madrid:201,guadalajara:289,toledo:205});
 assert.equal(result.otherPages,2);assert.equal(result.footerPages,697);
 assert.equal(stripStyle(withoutFooter(fs.readFileSync(path.join(root,'Antenas-Burgos/lerma.html'),'utf8'))),withoutFooter(other));
 assert.equal(fs.readFileSync(path.join(root,'404.html'),'utf8'),'<h1>404</h1>');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json')));
 for(const item of manifest.filter(p=>isCentralPage(p.path)))assert.ok(item.seoDescription.includes(MADRID_CONTACT.phone));
 assert.equal(manifest.at(-1).seoDescription,'Lerma | 641 589 394');
 assert.deepEqual(applyMadridContact(root),result);assert.deepEqual(auditMadridContact(root),result);
});
test('Inventario: un municipio de Toledo ausente impide modificar cualquier página',t=>{
 const root=fixture(t),file=path.join(root,'Antenas-Madrid/index.html'),before=fs.readFileSync(file);
 fs.rmSync(path.join(root,'Antenas-Toledo/town-0.html'));
 assert.throws(()=>applyMadridContact(root));assert.deepEqual(fs.readFileSync(file),before);
});
test('Seguridad: un pie desconocido detiene toda la transformación antes de escribir',t=>{
 const root=fixture(t),file=path.join(root,'Antenas-Madrid/index.html'),before=fs.readFileSync(file);
 fs.writeFileSync(path.join(root,'index.html'),sample.replace('<strong>Contacto</strong>','<strong>Otro bloque</strong>'));
 assert.throws(()=>applyMadridContact(root));assert.deepEqual(fs.readFileSync(file),before);
});
test('Distritos: el pie abreviado también recibe los dos contactos, sin duplicarse',()=>{
 const short='<footer class="footer"><div class="wrap"><strong>Antenas Rapid</strong><p>Servicio técnico de antenas, porteros y videoporteros. Consulta disponibilidad por localidad.</p></div></footer>';
 const original=sample.replace(/<footer\b[\s\S]*?<\/footer>/,short);
 const updated=rewriteRegionalPage(original,'/Antenas-Madrid/carabanchel.html');
 assertRegionalFooter(updated);assertMadridContact(updated);
 assert.equal(rewriteRegionalPage(updated,'/Antenas-Madrid/carabanchel.html'),updated);
 assert.equal(stripStyle(withoutFooter(updated)),replaceMadridContact(withoutFooter(original)));
});
