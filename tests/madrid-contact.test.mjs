import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {MADRID_CONTACT,isMadridPage,replaceMadridContact,assertMadridContact,applyMadridContact,auditMadridContact} from '../scripts/madrid-contact.mjs';
import districts from '../content/madrid-districts.json' with {type:'json'};

const sample=`<!doctype html><html><head><title>Antenista en Madrid | 641 589 394</title><meta name="robots" content="index,follow"><meta name="description" content="Llamar 641 589 394"><link rel="canonical" href="https://www.antenasrapid.com/antenas-madrid/madrid"><script type="application/ld+json">{"@graph":[{"telephone":"+34641589394","provider":{"telephone":"+34641589394"}}]}</script></head><body><header><a href="tel:+34641589394">641 589 394</a></header><h1>Antenas en Madrid</h1><a href="https://wa.me/34641589394?text=Llamar%20641%20589%20394">WhatsApp</a><footer><a href="tel:+34641589394">641 589 394</a></footer></body></html>`;
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'rapid-madrid-contact-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'Antenas-Madrid'));
 const manifest=Array.from({length:179},(_,i)=>({path:`/Antenas-Madrid/town-${i}.html`,seoDescription:'Madrid | 641 589 394'}));
 manifest.push({path:'/Antenas-Burgos/lerma.html',seoDescription:'Lerma | 641 589 394'});
 fs.writeFileSync(path.join(root,'local-pages-manifest.json'),JSON.stringify(manifest,null,2));
 for(const route of ['index.html',...manifest.slice(0,179).map(p=>path.basename(p.path)),...districts.districts.map(d=>d.slug+'.html')])fs.writeFileSync(path.join(root,'Antenas-Madrid',route),sample);
 fs.mkdirSync(path.join(root,'Antenas-Burgos'));
 fs.writeFileSync(path.join(root,'Antenas-Burgos/lerma.html'),sample.replaceAll('Madrid','Lerma'));
 fs.writeFileSync(path.join(root,'index.html'),sample);
 return root;
}
test('Madrid: número confirmado y selector limitado a su provincia',()=>{
 assert.deepEqual(MADRID_CONTACT,{phone:'614 78 99 45',tel:'+34614789945',whatsapp:'34614789945'});
 for(const route of ['/Antenas-Madrid/','Antenas-Madrid/index.html','/antenas-madrid/carabanchel','/Antenas-Madrid/madrid.html'])assert.ok(isMadridPage(route));
 for(const route of ['/','/Antenas-Toledo/','/Antenas-Guadalajara/','/Antenas-Madrid-extra/','/Antenas-Salamanca/madrid.html',null])assert.equal(isMadridPage(route),false);
});
test('Madrid: cabecera, pie, llamadas, WhatsApp, metadatos y schema coherentes',()=>{
 const updated=replaceMadridContact(sample);
 assert.deepEqual(assertMadridContact(updated),{calls:2,whatsapps:1});
 assert.ok(updated.includes('Llamar%20614%2078%2099%2045'));
 assert.equal(replaceMadridContact(updated),updated,'Transformación idempotente');
 const oldMarkup=sample.replaceAll('641 589 394','PHONE').replaceAll('641%20589%20394','ENCODED').replaceAll('641589394','DIGITS');
 const newMarkup=updated.replaceAll(MADRID_CONTACT.phone,'PHONE').replaceAll(encodeURIComponent(MADRID_CONTACT.phone),'ENCODED').replaceAll('614789945','DIGITS');
 assert.equal(newMarkup,oldMarkup,'Nada cambia salvo los números de contacto');
});
test('Madrid: falla por contactos antiguos, WhatsApp incorrecto o schema inválido',()=>{
 const updated=replaceMadridContact(sample);
 assert.throws(()=>assertMadridContact(sample));
 assert.throws(()=>assertMadridContact(updated.replace('wa.me/34614789945','wa.me/34999999999')));
 assert.throws(()=>assertMadridContact(updated.replace('tel:+34614789945','tel:+34999999999')));
 assert.throws(()=>assertMadridContact(updated.replace('"telephone":"+34614789945"','"telephone":"+34999999999"')));
 assert.throws(()=>assertMadridContact(updated.replace('{"@graph"','BROKEN{"@graph"')));
});
test('Madrid: exactamente 201 HTML; portada y otras provincias intactas',t=>{
 const root=fixture(t),home=fs.readFileSync(path.join(root,'index.html')),other=fs.readFileSync(path.join(root,'Antenas-Burgos/lerma.html'));
 const result=applyMadridContact(root);
 assert.equal(result.madridPages,201);assert.equal(result.otherPages,2);
 assert.deepEqual(fs.readFileSync(path.join(root,'index.html')),home);
 assert.deepEqual(fs.readFileSync(path.join(root,'Antenas-Burgos/lerma.html')),other);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json')));
 assert.ok(manifest[0].seoDescription.includes(MADRID_CONTACT.phone));
 assert.equal(manifest.at(-1).seoDescription,'Lerma | 641 589 394');
 assert.deepEqual(applyMadridContact(root),result);
 assert.deepEqual(auditMadridContact(root),result);
});
test('Madrid: inventario incompleto falla antes de modificar las páginas',t=>{
 const root=fixture(t),file=path.join(root,'Antenas-Madrid/index.html'),before=fs.readFileSync(file);
 fs.rmSync(path.join(root,'Antenas-Madrid',districts.districts[0].slug+'.html'));
 assert.throws(()=>applyMadridContact(root));assert.deepEqual(fs.readFileSync(file),before);
});
