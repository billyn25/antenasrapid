/** Read-only verification of every Madrid URL on the actual production domain. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import site from '../config/site.json' with {type:'json'};
import {MADRID_CONTACT,assertMadridContact} from './madrid-contact.mjs';
const domain=site.domain,report={domain,phone:MADRID_CONTACT.phone,pages:[],controls:[],ok:false};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function read(route){
 const response=await fetch(new URL(route,domain),{headers:{'User-Agent':'AntenasRapid-Madrid-contact-verification','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,`${route}: HTTP ${response.status}`);
 const html=await response.text();return {response,html};
}
try{
 // Give the independent Netlify deployment time to publish the same commit.
 let ready=false;
 for(let attempt=0;attempt<24;attempt++){
  try{const {html}=await read('/antenas-madrid/');assertMadridContact(html,'Madrid provincia');ready=true;break;}catch(error){console.log(`Esperando publicación Madrid (${attempt+1}/24): ${error.message}`);}
  if(attempt<23)await delay(10000);
 }
 assert.ok(ready,'El nuevo contacto todavía no se ha podido verificar en producción');
 const {html:xml}=await read('/sitemaps/sitemap-madrid.xml');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,201,'El sitemap debe conservar 201 URLs de Madrid');assert.equal(new Set(urls).size,201);
 for(const url of urls)assert.ok(url.startsWith(domain+'/antenas-madrid/'),'URL inesperada en sitemap Madrid: '+url);
 let next=0;
 await Promise.all(Array.from({length:4},async()=>{
  while(next<urls.length){
   const url=urls[next++];let lastError;
   for(let attempt=0;attempt<3;attempt++){
    try{
     const {response,html}=await read(url),counts=assertMadridContact(html,url);
     assert.equal(response.url,url,`${url}: el sitemap apunta a una redirección`);
     assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag')||''),`${url}: cabecera noindex`);
     assert.match(html,/<meta name="robots" content="index,follow">/);
     assert.ok(html.includes(`<link rel="canonical" href="${url}">`),`${url}: canonical distinto`);
     report.pages.push({url,status:response.status,...counts,ok:true});lastError=null;break;
    }catch(error){lastError=error;if(attempt<2)await delay(1500);}
   }
   if(lastError)report.pages.push({url,ok:false,error:lastError.message});
  }
 }));
 const {html:home}=await read('/');
 const controls=['/',...new Set([...home.matchAll(/href="(\/antenas-[a-z-]+\/)"/g)].map(m=>m[1]).filter(p=>p!='/antenas-madrid/'))];
 assert.equal(controls.length,19,'Deben comprobarse portada y 18 provincias ajenas a Madrid');
 for(const route of controls){
  const {html}=await read(route);
  assert.ok(html.includes(`href="tel:${site.tel}"`)&&html.includes(`https://wa.me/${site.whatsapp}`),`${route}: se perdió el contacto general`);
  for(const value of Object.values(MADRID_CONTACT))assert.ok(!html.includes(value),`${route}: contacto Madrid fuera de su provincia`);
  report.controls.push({url:domain+route,ok:true});
 }
 assert.equal(report.pages.filter(p=>p.ok).length,201,'Hay páginas de Madrid con fallo de contacto o indexabilidad');
 report.ok=true;
 console.log('MADRID PUBLICADO OK: 201/201 páginas con 614 78 99 45; llamadas, WhatsApp, metadatos, schema y canonicals revisados; portada y 18 provincias conservan su contacto.');
}catch(error){report.error=error.message;console.error(error);process.exitCode=1;}
finally{report.checkedAt=new Date().toISOString();report.pages.sort((a,b)=>a.url.localeCompare(b.url));fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/madrid-contact-live.json',JSON.stringify(report,null,2));}
