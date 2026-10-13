import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {canonicalUrl} from './canonical-urls.mjs';

const root=path.resolve(process.env.PRODUCTION_ROOT||'dist');
const data=JSON.parse(fs.readFileSync('content/madrid-districts.json','utf8'));
const routeFor=d=>`/Antenas-Madrid/${d.slug}.html`;
assert.equal(data.districts.length,21,'Madrid debe conservar 21 distritos');
assert.equal(new Set(data.districts.map(d=>d.slug)).size,21,'Distritos duplicados');

const province=fs.readFileSync(path.join(root,'Antenas-Madrid','index.html'),'utf8');
const city=fs.readFileSync(path.join(root,'Antenas-Madrid','madrid.html'),'utf8');
assert.ok(province.indexOf('id="distritos-madrid"') < province.indexOf('id="localidades"'),'Madrid: los distritos deben verse antes del directorio de municipios');
assert.ok(province.includes('class="province-grid madrid-district-grid"'),'Madrid: los distritos deben mostrarse como tarjetas visibles');
for(const html of [province,city]){
 assert.ok(html.includes('id="distritos-madrid"'),'Falta bloque de distritos de Madrid');
 for(const d of data.districts) assert.ok(html.includes(`href="${canonicalUrl(routeFor(d))}"`)||html.includes(`href="${routeFor(d)}"`),`Falta enlace a ${d.name}`);
}
for(const d of data.districts){
 const file=path.join(root,routeFor(d).slice(1));
 assert.ok(fs.existsSync(file),`Falta página de distrito ${d.name}`);
 const html=fs.readFileSync(file,'utf8');
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${d.name}: H1`);
 assert.ok(html.includes(`Antenista en ${d.name}, Madrid`),`${d.name}: intención local`);
 assert.ok(html.includes('Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros'),`${d.name}: servicio principal`);
 assert.ok(html.includes('no representa una oficina o sede física'),`${d.name}: aclaración de cobertura`);
 assert.ok(html.includes('href="/favicon.png"')&&html.includes('href="/favicon.ico"'),`${d.name}: favicon`);
 const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
 const previewCanonical='https://www.antenasrapid.com'+routeFor(d); const productionCanonical=canonicalUrl(previewCanonical); assert.ok(canonical===previewCanonical||canonical===productionCanonical,`${d.name}: canonical`);
}
const sitemap=path.join(root,'sitemaps','sitemap-madrid.xml');
if(fs.existsSync(sitemap)){
 const xml=fs.readFileSync(sitemap,'utf8');
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,201,'Madrid: 179 municipios + provincia + 21 distritos');
 for(const d of data.districts) assert.ok(urls.includes(canonicalUrl('https://www.antenasrapid.com'+routeFor(d))),`Sitemap Madrid: falta ${d.name}`);
}
console.log('AUDITORÍA DISTRITOS MADRID OK: 21 distritos enlazados, canonicals propios y sitemap coherente.');
