import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {canonicalPath,canonicalUrl,rewriteCanonicalHtml,publicRouteMap} from '../scripts/canonical-urls.mjs';
test('provincia canónica en minúsculas con barra final',()=>{
 for(const [a,b] of [['/Antenas-Cantabria/','/antenas-cantabria/'],['/Antenas-Madrid','/antenas-madrid/'],['/Antenas-Madrid/index.html','/antenas-madrid/']])assert.equal(canonicalPath(a),b);
});
test('pueblo canónico sin html ni barra extra; conserva consulta y ancla',()=>{
 for(const p of ['/Antenas-Madrid/corpa.html','/antenas-madrid/corpa','/antenas-madrid/corpa/'])assert.equal(canonicalPath(p),'/antenas-madrid/corpa');
 assert.equal(canonicalPath('/Antenas-Madrid/corpa.html?ref=x#preguntas'),'/antenas-madrid/corpa?ref=x#preguntas');
});
test('origen de producción, sin tocar dominios externos ni mensajes de contacto',()=>{
 assert.equal(canonicalUrl('http://antenasrapid.com/Antenas-Madrid/corpa.html'),'https://www.antenasrapid.com/antenas-madrid/corpa');
 for(const u of ['https://otro.com/Antenas-Madrid/corpa.html','https://wa.me/34641589394?text=Antenas-Madrid','tel:+34641589394','/#zonas','/assets/Foto.JPG','/Antenas-Madrid/Foto.JPG','//otro.com/Test.html','/cookies.html'])assert.equal(canonicalUrl(u),u);
});
test('transformación limitada a referencias URL y datos estructurados; idempotente',()=>{
 const before='<head><title>Antenista en Corpa</title><meta name="description" content="Texto del servicio"><link rel="canonical" href="https://www.antenasrapid.com/Antenas-Madrid/corpa.html"><meta property="og:url" content="https://www.antenasrapid.com/Antenas-Madrid/corpa.html"><script type="application/ld+json">{"url":"https://www.antenasrapid.com/Antenas-Madrid/corpa.html","@id":"https://www.antenasrapid.com/Antenas-Madrid/corpa.html#page"}</script></head><body><h1>Corpa</h1><a href="/Antenas-Madrid/corpa.html#preguntas">Consultar Corpa</a><img src="/assets/Foto.JPG"></body>';
 const after=rewriteCanonicalHtml(before);assert.ok(!after.includes('/Antenas-Madrid/'));
 assert.ok(after.includes('<h1>Corpa</h1>'));assert.ok(after.includes('<title>Antenista en Corpa</title>'));assert.ok(after.includes('/antenas-madrid/corpa#preguntas'));assert.ok(after.includes('<img src="/assets/Foto.JPG">'));
 assert.equal(rewriteCanonicalHtml(after),after);
});
test('no se aceptan datos estructurados corruptos',()=>assert.throws(()=>rewriteCanonicalHtml('<script type="application/ld+json">{mal}</script>')));
test('las rutas públicas conservan el archivo físico; detectar colisiones',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'rapid-routes-'));
 try{
  fs.mkdirSync(path.join(root,'Antenas-Madrid'));fs.writeFileSync(path.join(root,'index.html'),'');fs.writeFileSync(path.join(root,'Antenas-Madrid/index.html'),'');fs.writeFileSync(path.join(root,'Antenas-Madrid/corpa.html'),'');
  const routes=publicRouteMap(root);assert.equal(routes.get('/'),path.join(root,'index.html'));assert.equal(routes.get('/antenas-madrid/'),path.join(root,'Antenas-Madrid/index.html'));assert.equal(routes.get('/antenas-madrid/corpa'),path.join(root,'Antenas-Madrid/corpa.html'));
  fs.mkdirSync(path.join(root,'antenas-madrid'));fs.writeFileSync(path.join(root,'antenas-madrid/corpa.html'),'');assert.throws(()=>publicRouteMap(root),/Colisión/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
