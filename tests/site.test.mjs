import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {esc,pages,site,routeFile,renderPage,townIndex,build} from '../scripts/build.mjs';
test('mantiene mayúsculas, carpetas y .html',()=>{assert.equal(routeFile('/Antenas-Burgos/lerma.html'),'Antenas-Burgos/lerma.html');assert.equal(routeFile('/Antenas-Bizkaia/'),'Antenas-Bizkaia/index.html');assert.equal(routeFile('/'),'index.html');});
test('rechaza rutas fuera del proyecto',()=>{for(const p of ['/../secret','/a?b','/a\\b'])assert.throws(()=>routeFile(p));});
test('escapa texto y atributos',()=>assert.equal(esc('<a "x"> &'), '&lt;a &quot;x&quot;&gt; &amp;'));
test('dieciocho páginas base separadas sin importar otras localidades',()=>{assert.equal(pages.length,18);assert.equal(pages.filter(p=>p.type==='province').length,15);assert.equal(pages.filter(p=>p.type==='town').length,2);});
test('preview noindex sin analítica en todas las páginas',()=>{for(const p of pages){const h=renderPage(p);assert.match(h,/noindex,nofollow/);assert.ok(!/googletagmanager|google-analytics|G-W8L23NJLP6|antenistacerca/i.test(h));assert.equal((h.match(/<h1>/g)||[]).length,1);assert.ok(h.includes(site.tel));}});
test('cada municipio de la selección está en HTML sin JavaScript',()=>{for(const p of pages.filter(p=>p.type==='province'))for(const n of p.towns)assert.ok(townIndex(p).includes(esc(n)));});
test('enlaces locales conocidos se conservan',()=>{assert.match(townIndex(pages.find(p=>p.name==='Bizkaia')),/href="\/Antenas-Bizkaia\/bilbao.html"/);assert.match(townIndex(pages.find(p=>p.name==='Burgos')),/href="\/Antenas-Burgos\/lerma.html"/);});
test('generación determinista y libre de duplicados',()=>{for(const p of pages)assert.equal(renderPage(p),renderPage(p));assert.equal(new Set(pages.map(p=>p.path)).size,pages.length);});
// Entornos explícitos: los tests no heredan URL, DEPLOY_PRIME_URL ni SITE_MODE de Netlify.
test('modo de producción bloqueado en el generador base',()=>{
 assert.throws(()=>build('dist',{SITE_MODE:'production'}),/bloqueada/);
});
test('no permite una preview con URL o DEPLOY_PRIME_URL del dominio vivo',()=>{
 for(const key of ['URL','DEPLOY_PRIME_URL']){
  for(const host of [site.domain,site.domain.replace('www.','')]){
   assert.throws(()=>build('dist',{SITE_MODE:'preview',[key]:host}),/dominio actual/);
  }
 }
});
test('crea HTML real, 404 y cabeceras sin sitemap incompleto',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rapid-test-'));
 try{
  assert.equal(build(dir,{SITE_MODE:'preview'}),18);
  assert.ok(fs.existsSync(path.join(dir,'404.html')));
  assert.match(fs.readFileSync(path.join(dir,'_headers'),'utf8'),/noindex/);
  assert.ok(!fs.existsSync(path.join(dir,'sitemap.xml')));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('pipeline autorizado admite el dominio vivo sin abrir indexación antes de auditar',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rapid-netlify-'));
 const env={SITE_MODE:'preview',ANTENASRAPID_BUILD_TARGET:'production',NETLIFY:'true',CONTEXT:'production',URL:site.domain,DEPLOY_PRIME_URL:site.domain};
 const original={...env};
 try{
  assert.equal(build(dir,env),18);
  assert.deepEqual(env,original,'El build no debe mutar el entorno recibido');
  assert.match(fs.readFileSync(path.join(dir,'index.html'),'utf8'),/content="noindex,nofollow"/);
  assert.match(fs.readFileSync(path.join(dir,'_headers'),'utf8'),/X-Robots-Tag: noindex/);
  assert.ok(!fs.existsSync(path.join(dir,'sitemap.xml')));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('el marcador de producción no permite indexar deploy previews ni ramas',()=>{
 for(const context of ['deploy-preview','branch-deploy','dev']){
  assert.throws(()=>build('dist',{SITE_MODE:'preview',ANTENASRAPID_BUILD_TARGET:'production',CONTEXT:context}),/bloqueada/);
 }
});
test('build:production autoriza la fase base y conserva ambas auditorías',()=>{
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.match(pkg.scripts['build:production'],/^ANTENASRAPID_BUILD_TARGET=production SITE_MODE=preview npm run build && CONFIRM_PRODUCTION_PREP=1 npm run prepare:production && npm run audit:production$/);
});
