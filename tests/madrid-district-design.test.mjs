import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {brandMark} from '../scripts/logo.mjs';
import data from '../content/madrid-districts.json' with {type:'json'};
import {upgradeDistrict,assertDistrictDesign,applyDistrictDesign} from '../scripts/madrid-district-design.mjs';
const metadata='<title>Antenista en Chamberí, Madrid</title><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://www.antenasrapid.com/Antenas-Madrid/chamberi.html"><script type="application/ld+json">{"telephone":"+34641589394"}</script>';
const css='<link rel="stylesheet" href="/assets/site.css">';
const city=`<html><head>${metadata}<link rel="stylesheet" href="/assets/site.css?v=current"><style id="urgent-24h-style">.urgent-hero{color:red}</style></head><body><header><a class="brand" href="/">${brandMark()}</a><a href="#servicios">Servicios</a><a href="tel:+34641589394">641 589 394</a></header><main>Madrid</main><footer class="footer"><a href="/cookies.html">Cookies</a><div><strong>Contacto</strong><p>641 589 394</p></div></footer><aside class="cookie-notice" data-cookie-notice hidden>Información</aside><div class="mobilebar"><a href="tel:+34641589394">641 589 394</a><a href="https://wa.me/34641589394">WhatsApp</a></div></body></html>`;
const raw=`<html><head>${metadata}${css}</head><body><header><strong>ANTENAS RAPID</strong></header><main id="contenido" data-district-page="madrid"><nav class="breadcrumbs wrap">Chamberí</nav><section class="hero"><div class="hero-copy"><h1>Antenista en Chamberí, Madrid</h1><a class="btn" href="tel:+34641589394">641 589 394</a><a class="btn" href="https://wa.me/34641589394">WhatsApp</a></div></section><section class="section wrap"><span class="eyebrow">SERVICIO TÉCNICO</span><div class="local-intents"><article><h3>Porteros automáticos y videoporteros</h3></article><article><h3>Cobertura móvil 4G/5G en vivienda</h3></article></div></section><section id="distritos-madrid"><a href="/Antenas-Madrid/retiro.html">Retiro</a></section><section id="contacto">Consulta</section></main><footer class="footer">Anterior</footer><div class="mobilebar"><a href="tel:+34641589394">641 589 394</a></div></body></html>`;

test('district uses current municipal logo, CSS, photo hero, footer and contact bar',()=>{
 const updated=upgradeDistrict(raw,city);assertDistrictDesign(updated,city);
 assert.ok(updated.includes(brandMark()));assert.ok(updated.includes('home-clean-hero madrid-photo-hero'));
 for(const tag of metadata.match(/<title>[\s\S]*?<\/title>|<meta[^>]*>|<link[^>]*>|<script[\s\S]*?<\/script>/g))assert.ok(updated.includes(tag));
 assert.ok(updated.includes('href="/Antenas-Madrid/retiro.html"'));
 assert.equal(upgradeDistrict(updated,city),updated);
});
test('both preview and final regional contact are preserved',()=>{
 const convert=h=>h.replaceAll('641 589 394','614 78 99 45').replaceAll('34641589394','34614789945').replaceAll('noindex,nofollow','index,follow');
 const updated=upgradeDistrict(convert(raw),convert(city));assertDistrictDesign(updated,convert(city));
 assert.ok(updated.includes('tel:+34614789945'));assert.ok(!updated.includes('641589394'));
});
test('missing template pieces, wrong CSS and non-district pages fail closed',()=>{
 assert.throws(()=>upgradeDistrict(raw.replace('data-district-page="madrid"',''),city));
 assert.throws(()=>upgradeDistrict(raw,city.replace(/<header>[\s\S]*?<\/header>/,'')));
 assert.throws(()=>upgradeDistrict(raw,city.replace('class="rapid-brand-logo"','class="missing-logo"')));
 const updated=upgradeDistrict(raw,city);
 assert.throws(()=>assertDistrictDesign(updated.replace('/assets/site.css?v=current','/assets/site.css?v=old'),city));
});
test('only the 21 district files change; other pages and sitemap stay byte-identical',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'district-design-'));
 try{
  fs.mkdirSync(path.join(root,'Antenas-Madrid'));fs.writeFileSync(path.join(root,'Antenas-Madrid/madrid.html'),city);
  for(const d of data.districts)fs.writeFileSync(path.join(root,'Antenas-Madrid',d.slug+'.html'),raw);
  fs.writeFileSync(path.join(root,'index.html'),'home unchanged');fs.writeFileSync(path.join(root,'sitemap.xml'),'<unchanged/>');
  assert.equal(applyDistrictDesign(root),21);assert.equal(applyDistrictDesign(root,true),21);
  assert.equal(fs.readFileSync(path.join(root,'index.html'),'utf8'),'home unchanged');
  assert.equal(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),'<unchanged/>');
  assert.equal(fs.readFileSync(path.join(root,'Antenas-Madrid/madrid.html'),'utf8'),city);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
