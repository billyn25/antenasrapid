import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4184'},stdio:'pipe'});
let browser;
try{
 browser=await chromium.launch();
 const base='http://127.0.0.1:4184';
 for(let i=0;i<50;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const towns=JSON.parse(fs.readFileSync('dist/local-pages-manifest.json','utf8'));
 const selections=[['Burgos','Lerma'],['Bizkaia','Zalla'],['Madrid','Torrelaguna'],['Madrid','Madrid'],['Cantabria',null],['Toledo',null],['Zamora',null]];
 fs.mkdirSync('qa/town-section-order',{recursive:true});
 const results=[];
 for(const [province,name] of selections){
  const town=towns.find(t=>t.province===province&&(!name||t.name===name));assert.ok(town,province);
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const r=await page.goto(base+town.path,{waitUntil:'networkidle'});assert.equal(r.status(),200);
   const privacy=page.getByRole('button',{name:'Entendido',exact:true});if(await privacy.isVisible())await privacy.click();
   assert.equal(await page.locator('main[data-town-order="20261023"]').count(),1);
   assert.equal(await page.locator('#servicios .service-card').count(),9);
   assert.equal(await page.locator('#servicios .service-card p').count(),9);
   assert.equal(await page.locator('[data-whatsapp-form]').count(),1);
   assert.equal(await page.locator('#pueblos-cercanos [data-nearby-ine]').count(),6);
   const errors=await page.evaluate(()=>{
    const errors=[];
    if(document.documentElement.scrollWidth>innerWidth+2)errors.push('horizontal overflow');
    const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);if(new Set(ids).size!==ids.length)errors.push('duplicate IDs');
    const items=[...document.querySelector('main').children];
    const selectors=['#servicios','#problemas-tdt','#porteros-videoporteros','#cobertura-movil','#soluciones-tecnicas','#servicio-local','.local-service-depth','.madrid-seo-depth','.madrid-service-links','#experiencia','#galeria','#contexto-municipal','#codigos-postales','#distritos-madrid','#preguntas','#contacto','#zonas','#pueblos-cercanos'];
    let last=-1;
    for(const selector of selectors){const n=document.querySelector('main '+selector);if(!n)continue;const at=items.indexOf(n);if(at<=last)errors.push('wrong order '+selector);last=at;}
    for(const a of document.querySelectorAll('main a[href^="#"]'))if(a.hash&&!document.getElementById(decodeURIComponent(a.hash.slice(1))))errors.push('missing anchor '+a.hash);
    return errors;
   });assert.deepEqual(errors,[],town.path+' '+width);
   if(await page.locator('.gallery-open').count()){
    await page.locator('.gallery-open').first().click();assert.equal(await page.locator('#gallery-lightbox').evaluate(n=>n.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#gallery-lightbox').evaluate(n=>n.open),false);
   }
   if(width===390){
    await page.locator('#problemas-tdt h2').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/town-section-order/${province}-tdt-mobile.png`});
    await page.locator('#contacto h2').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/town-section-order/${province}-contact-mobile.png`});
   }
   results.push({town:town.name,province,width,order:true,services:9,form:true,nearby:6,noOverflow:true});await page.close();
  }
 }
 fs.writeFileSync('qa/town-section-order/results.json',JSON.stringify(results,null,2));
 console.log(`ORDEN MUNICIPAL BROWSER OK: ${results.length} casos; seis provincias y Madrid capital, cuatro tamaños, servicios completos, anclas, formulario, galería y cercanos.`);
}finally{await browser?.close();server.kill();}
