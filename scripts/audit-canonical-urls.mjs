import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {canonicalUrl,canonicalPath,htmlFiles,publicRouteMap,PRODUCTION_DOMAIN as domain} from './canonical-urls.mjs';
const root=path.resolve(process.env.PRODUCTION_ROOT||'dist');
const routes=publicRouteMap(root),files=htmlFiles(root),indexed=new Set(),ids=new Map(),links=[];
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
let checkedLinks=0,provinces=0;
for(const file of files){
 const h=fs.readFileSync(file,'utf8'),rel=path.relative(root,file).split(path.sep).join('/');
 const canonical=decode(h.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||'');
 const route=canonical?new URL(canonical).pathname:canonicalPath('/'+rel);
 const allIds=[...h.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);ids.set(route,new Set(allIds));
 assert.equal(allIds.length,new Set(allIds).size,`${rel}: IDs duplicados`);
 if(canonical){
  assert.equal(canonical,canonicalUrl(canonical),`${rel}: canonical apunta a variante redirigida`);
  assert.equal(routes.get(new URL(canonical).pathname),file,`${rel}: canonical no corresponde a su HTML`);
 }
 if(/<meta name="robots" content="index,follow">/.test(h)){
  assert.ok(canonical.startsWith(domain+'/'),`${rel}: canonical de otro dominio`);
  assert.ok(!indexed.has(canonical),`${rel}: canonical duplicado`);indexed.add(canonical);
 }
 if(/^Antenas-/.test(rel)&&rel.endsWith('/index.html'))provinces++;
 for(const match of h.matchAll(/\bhref="([^"]*)"/g)){
  const href=decode(match[1]);assert.equal(href,canonicalUrl(href),`${rel}: enlace a redirección ${href}`);
  if(href.startsWith('//')||(!href.startsWith('/')&&!href.startsWith('#')&&!href.startsWith(domain+'/')))continue;
  links.push([route,href]);
 }
 const checkStrings=v=>{
  if(typeof v==='string')assert.equal(v,canonicalUrl(v),`${rel}: datos estructurados con URL antigua`);
  else if(Array.isArray(v))v.forEach(checkStrings);else if(v&&typeof v==='object')Object.values(v).forEach(checkStrings);
 };
 for(const m of h.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))checkStrings(JSON.parse(m[1]));
}
for(const [route,href] of links){
 const url=new URL(href,domain+(route||'/')),target=decodeURIComponent(url.pathname);
 const file=routes.get(target)||path.join(root,target.slice(1));
 assert.ok(fs.existsSync(file)&&fs.statSync(file).isFile(),`${route}: destino inexistente ${href}`);
 if(url.hash&&ids.has(url.pathname))assert.ok(ids.get(url.pathname).has(decodeURIComponent(url.hash.slice(1))),`${route}: ancla inexistente ${href}`);
 checkedLinks++;
}
const listed=[];
for(const file of fs.readdirSync(path.join(root,'sitemaps'))){
 const xml=fs.readFileSync(path.join(root,'sitemaps',file),'utf8');
 for(const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)){
  const url=decode(m[1]);assert.equal(url,canonicalUrl(url),'Sitemap con redirección '+url);
  assert.ok(indexed.has(url),'Sitemap fuera del conjunto indexable '+url);listed.push(url);
 }
}
assert.equal(listed.length,indexed.size);assert.equal(new Set(listed).size,listed.length);
assert.equal(provinces,19);assert.equal(indexed.size,3818);
console.log(`AUDITORÍA CANÓNICA OK: ${indexed.size} URLs indexables; ${provinces} provincias; ${checkedLinks} enlaces/anclas; sitemap, canónicas y schema coherentes; sin cambios de rutas físicas.`);
