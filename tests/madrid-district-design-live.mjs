/** Read-only verification of the published district template and its real assets. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import site from '../config/site.json' with {type:'json'};
import data from '../content/madrid-districts.json' with {type:'json'};
import {assertDistrictDesign,version} from '../scripts/madrid-district-design.mjs';
import {assertPageContact} from '../scripts/madrid-contact.mjs';
const origin=site.domain,out='qa/district-design';
fs.mkdirSync(out,{recursive:true});
const result={origin,version,commit:process.env.GITHUB_SHA||null,districts:[],controls:[],assets:[],browser:[],ok:false};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function read(route){
 const r=await fetch(new URL(route,origin),{redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,200,route+': HTTP '+r.status);return {r,html:await r.text()};
}
let browser;
try{
 let ready=false;
 for(let i=0;i<24;i++){
  try{const {html}=await read('/antenas-madrid/chamberi');assert.ok(html.includes('data-district-design="'+version+'"'));ready=true;break;}
  catch(e){result.lastObservation=e.message;if(i<23)await wait(5000);}
 }
 assert.ok(ready,'El nuevo diseño todavía no se ha confirmado en producción');
 const {html:city}=await read('/antenas-madrid/madrid');
 let index=0;await Promise.all(Array.from({length:3},async()=>{
  while(index<data.districts.length){
   const d=data.districts[index++],route='/antenas-madrid/'+d.slug;let failure;
   for(let n=0;n<3;n++){
    try{const {r,html}=await read(route);assertDistrictDesign(html,city,d.name);assertPageContact(html,true,d.name);
     assert.ok(!/noindex/i.test(r.headers.get('x-robots-tag')||''));assert.ok(html.includes('<meta name="robots" content="index,follow">'));
     assert.ok(html.includes('<link rel="canonical" href="'+origin+route+'">'));
     result.districts.push({url:origin+route,status:r.status,logo:true,municipalCSS:true,regionalContact:true,ok:true});failure=null;break;
    }catch(e){failure=e;if(n<2)await wait(1000);}
   }
   if(failure)result.districts.push({url:origin+route,ok:false,error:failure.message});
  }
 }));
 assert.equal(result.districts.length,21);assert.ok(result.districts.every(x=>x.ok),'Hay distritos con diseño sin actualizar');
 for(const [route,central] of [['/',false],['/antenas-madrid/madrid',true],['/antenas-madrid/moralzarzal',true],['/antenas-burgos/lerma',false]]){
  const {html}=await read(route);assertPageContact(html,central,route);assert.ok(!html.includes('data-district-design='));result.controls.push({url:origin+route,ok:true});
 }
 const {html:sitemap}=await read('/sitemaps/sitemap-madrid.xml');
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,201);
 for(const d of data.districts)assert.ok(urls.includes(origin+'/antenas-madrid/'+d.slug));
 const css=city.match(/<link rel="stylesheet" href="([^\"]*\/site\.css[^\"]*)"/)?.[1];assert.ok(css);
 for(const route of [css,'/assets/logo-antenasrapid.webp','/assets/hero-antenasrapid-HQ.jpg']){
  const r=await fetch(new URL(route,origin),{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);
  const bytes=Buffer.from(await r.arrayBuffer()),local=fs.readFileSync('dist'+new URL(route,origin).pathname);assert.equal(sha(bytes),sha(local),route+': recurso publicado distinto');
  result.assets.push({url:origin+route,sha256:sha(bytes),matchesBuild:true});
 }
 browser=await chromium.launch({headless:true});
 for(const [width,javascript] of [[320,true],[390,true],[768,true],[1440,true],[390,false]]){
  const context=await browser.newContext({viewport:{width,height:950},javaScriptEnabled:javascript});const page=await context.newPage();
  for(const slug of ['chamberi','fuencarral-el-pardo','san-blas-canillejas']){
   await page.goto(origin+'/antenas-madrid/'+slug,{waitUntil:'networkidle'});
   const logo=page.locator('header img.rapid-brand-logo');assert.equal(await logo.count(),1);assert.ok(await logo.isVisible());
   assert.ok(await logo.evaluate(el=>el.complete&&el.naturalWidth>0));
   assert.equal(await page.locator('.contact-top a').getAttribute('href'),'tel:+34614789945');
   const visual=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth,hero:getComputedStyle(document.querySelector('.hero'),'::before').backgroundImage,grid:getComputedStyle(document.querySelector('.local-intents')).display}));
   assert.ok(visual.scroll<=visual.width+1,'Desbordamiento '+slug+' '+width);assert.equal(visual.grid,'grid');assert.ok(visual.hero.includes('hero-antenasrapid-HQ.jpg'));
   result.browser.push({slug,width,javascript,logoVisible:true,currentHero:true,noOverflow:true});
   if(slug==='chamberi'&&javascript&&[390,1440].includes(width))await page.screenshot({path:out+`/chamberi-${width}.png`});
  }
  await context.close();
 }
 result.ok=true;console.log('DISTRITOS PUBLICADOS OK: 21/21; mismo logo y CSS municipal, 614 78 99 45, 201 URLs en sitemap y 15 pruebas visuales.');
}catch(error){result.error=error.message;process.exitCode=1;console.error(error);}
finally{if(browser)await browser.close();result.checkedAt=new Date().toISOString();result.districts.sort((a,b)=>a.url.localeCompare(b.url));fs.writeFileSync(out+'/published.json',JSON.stringify(result,null,2));}
