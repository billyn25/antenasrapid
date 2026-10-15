/** Read-only production check: every central URL and representative northern controls. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import site from '../config/site.json' with {type:'json'};
import {MADRID_CONTACT,CENTRAL_PROVINCES,isCentralPage,assertPageContact} from './madrid-contact.mjs';
const domain=site.domain,report={domain,phone:MADRID_CONTACT.phone,byProvince:{},pages:[],controls:[],ok:false};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function read(route){
 const response=await fetch(new URL(route,domain),{headers:{'User-Agent':'AntenasRapid-Regional-contact-verification','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
 assert.equal(response.status,200,`${route}: HTTP ${response.status}`);
 return {response,html:await response.text()};
}
async function sitemap(slug){
 const {html:xml}=await read(`/sitemaps/sitemap-${slug}.xml`);
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(new Set(urls).size,urls.length,`${slug}: URLs repetidas`);
 for(const url of urls)assert.ok(url.startsWith(domain+`/antenas-${slug}/`),`${slug}: URL ajena a la provincia`);
 return urls;
}
try{
 // Netlify publishes independently from GitHub Actions; wait for all three province hubs.
 let ready=false;
 for(let attempt=0;attempt<24;attempt++){
  try{
   for(const p of CENTRAL_PROVINCES){const {html}=await read(`/antenas-${p.slug}/`);assertPageContact(html,true,p.name);}
   const {html}=await read('/');assertPageContact(html,false,'Portada');
   const {html:css}=await read('/assets/regional-contact.css?v=20261015');assert.ok(css.includes('.regional-phone'),'Falta CSS del pie');
   ready=true;break;
  }catch(error){console.log(`Esperando contactos regionales (${attempt+1}/24): ${error.message}`);}
  if(attempt<23)await delay(10000);
 }
 assert.ok(ready,'El contacto regional todavía no está verificado en producción');
 const urls=[];
 for(const p of CENTRAL_PROVINCES){
  const group=await sitemap(p.slug),expected=p.municipalities+p.districts+1;
  assert.equal(group.length,expected,`${p.name}: cambió el inventario de URLs`);
  report.byProvince[p.slug]=group.length;urls.push(...group);
 }
 assert.equal(urls.length,695);
 let next=0;
 await Promise.all(Array.from({length:4},async()=>{
  while(next<urls.length){
   const url=urls[next++];let lastError;
   for(let attempt=0;attempt<3;attempt++){
    try{
     const {response,html}=await read(url),counts=assertPageContact(html,true,url);
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
 const provinces=[...new Set([...home.matchAll(/href="(\/antenas-[a-z-]+\/)"/g)].map(m=>m[1]).filter(p=>!isCentralPage(p)))];
 assert.equal(provinces.length,16,'Deben conservarse las otras 16 provincias');
 const controls=['/',...provinces,'/aviso-legal','/privacidad','/cookies'];
 for(const province of provinces){
  const slug=province.replace('/antenas-','').replace(/\/$/,''),group=await sitemap(slug);
  const town=group.find(url=>new URL(url).pathname!==province);
  assert.ok(town,`${province}: falta control de municipio`);controls.push(town);
 }
 for(const route of controls){
  const {response,html}=await read(route),counts=assertPageContact(html,false,route);
  report.controls.push({url:response.url,status:response.status,...counts,ok:true});
 }
 assert.equal(report.controls.length,36);
 assert.equal(report.pages.filter(p=>p.ok).length,695,'Alguna página central tiene contacto o SEO técnico incorrecto');
 report.ok=true;
 console.log('CONTACTOS PUBLICADOS OK: Madrid 201/201, Guadalajara 289/289 y Toledo 205/205; teléfono principal 614 78 99 45, ambos contactos en el pie, canonicals e indexabilidad revisados. Portada, otras 16 provincias, 16 municipios y tres páginas legales verificados.');
}catch(error){report.error=error.message;console.error(error);process.exitCode=1;}
finally{report.checkedAt=new Date().toISOString();report.pages.sort((a,b)=>a.url.localeCompare(b.url));fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/madrid-contact-live.json',JSON.stringify(report,null,2));}
