import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import site from '../config/site.json' with {type:'json'};
import data from '../content/hendaya-trabajos.json' with {type:'json'};
import {renderFooter} from './footer.mjs';
import {renderWorkDate} from './work-publication.mjs';
import {serviceSection} from './build.mjs';
import {doorphones} from './doorphones.mjs';
import {renderHomeContact} from './home-contact.mjs';
import services from '../content/services.json' with {type:'json'};
import pages from '../content/pages.json' with {type:'json'};

const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const asset = name => '/assets/galeria/' + name;
const title = 'Antenista en Hendaya, Francia | Instalación y reparación · Rapid';
const description = 'Antenista en Hendaya, Francia. Antenas TDT/TNT y parabólicas, porteros, videoporteros y revisión de señal. Urgencias 24h: 641 589 394. Trabajos reales.';

export function applyHendayaService(root, {checkIrunLink = true} = {}) {
  assert.equal(data.serviceRoute, '/antenista-hendaya-francia/');
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const header = home.match(/<header>[\s\S]*?<\/header>/)?.[0];
  assert.ok(header, 'Hendaya: falta la cabecera compartida');
  const localHeader = header.replace('href="#zonas"', 'href="/#zonas"');
  const url = site.domain + data.serviceRoute;
  const featured = data.photos[0];
  const locality = {type:'town', name:'Hendaya'};
  const localServices = services.map(service => service.id === 'tdt'
    ? {...service, name:'Antenas TDT / TNT', short:'Recepción de televisión terrestre en Hendaya.'}
    : service.id === 'tdt-satelite'
      ? {...service, name:'Televisión por satélite HD', text:'Instalación de parabólica y receptor para los canales de satélite que necesitas. Revisamos la compatibilidad del receptor y las condiciones del servicio elegido antes de preparar el montaje.'}
      : service);
  const serviceBlock = serviceSection(locality, localServices).replace('TDT, parabólicas y amplificadores.', 'TDT/TNT, parabólicas y amplificadores.');
  const relatedServices = doorphones(locality, site.phone, 'tel:'+site.tel, esc)
    .replace(/<div class="stars"[^>]*>[\s\S]*?<\/div>/, '');
  const contactBlock = renderHomeContact(pages.filter(page => page.type === 'province'), localServices, esc, {countryCode:'FR',locality:'Hendaya'});
  const diagnostics = [
    ['Dos antenas y orientaciones distintas', 'En las cuatro instalaciones fotografiadas de Hendaya se montaron dos antenas. Para una vivienda nueva comprobamos qué señales llegan a su ubicación y qué canales se necesitan antes de elegir el montaje.'],
    ['Medición de señal y amplificación', 'Comprobación del nivel y la calidad de la señal en recepción y en las tomas. Revisamos el previo de mástil, la fuente de alimentación y los amplificadores para ajustar la distribución.'],
    ['Cableado exterior y conectores', 'Revisión del coaxial expuesto, las conexiones y los tramos que llegan a cada habitación. Sustituimos el cable deteriorado por cable apto para exterior y comprobamos la señal al final del recorrido.'],
    ['Mástiles, soportes y fijaciones', 'Revisión del estado del mástil, abrazaderas y anclajes cuando una antena se mueve o necesita renovación. Valoramos el acceso al tejado o a la fachada antes de organizar la intervención.'],
    ['Parabólicas y LNB', 'Orientación de la parabólica y revisión del LNB, su alimentación y las conexiones. Comprobamos el recorrido del cable y la recepción en el equipo de satélite.'],
    ['Comunidades y varias tomas de televisión', 'Cuando fallan varias viviendas, revisamos la cabecera y la distribución común. Si solo falla una toma, seguimos su derivación para localizar el tramo que necesita reparación.']
  ];
  const technicalBlock = `<section class="section wrap technical-services" id="soluciones-tecnicas"><span class="eyebrow">Recepción · Distribución · Diagnóstico</span><h2>Soluciones y diagnóstico de instalaciones en Hendaya</h2><div class="technical-grid">${diagnostics.map(([heading,copy],index) => `<article><span class="technical-number">${String(index+1).padStart(2,'0')}</span><h3>${heading}</h3><p>${copy}</p><a href="#contacto">Consultar este trabajo →</a></article>`).join('')}</div></section>`;
  const receptionBlock = `<section class="section wrap tv-reception" id="problemas-tdt"><div class="tv-reception-layout"><div class="tv-reception-copy"><span class="eyebrow">Cuando falla la televisión</span><h2>Problemas de recepción en Hendaya</h2><p>Indica qué canales quieres recibir, cuáles faltan y si el fallo afecta a todas las televisiones.</p><a class="tv-reception-cta" href="#contacto" data-contact-service="tdt" data-contact-reception="true">Consultar mi recepción de TV</a></div><div class="tv-reception-questions"><details class="tv-reception-question" open><summary>Faltan canales o se pixela la imagen</summary><p>Comparamos la señal de las antenas con la que llega a las tomas. Revisamos orientación, amplificación y conexiones para localizar la pérdida antes de cambiar equipos.</p></details><details class="tv-reception-question"><summary>La televisión falla después de llover</summary><p>Revisamos el cable exterior y las conexiones por si entra agua o hay deterioro. Tras reparar el tramo afectado, comprobamos de nuevo la recepción.</p></details><details class="tv-reception-question"><summary>Solo falla una habitación o una vivienda</summary><p>Comparamos con las otras tomas para distinguir un problema de la antena de otro del cableado interior, un repartidor o una conexión.</p></details></div></div></section>`;
  const wa = 'https://wa.me/' + site.whatsapp + '?text=' + encodeURIComponent('Hola, necesito un antenista en Hendaya, Francia.');
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':url+'#pagina',url,name:title,description,inLanguage:'es',isPartOf:{'@id':site.domain+'/#website'},mainEntity:{'@id':url+'#servicio'}},
    {'@type':'Service','@id':url+'#servicio',url,name:'Instalación y reparación de antenas en Hendaya',serviceType:localServices.map(service => service.name),provider:{'@type':'Organization',name:site.brand,url:site.domain+'/',telephone:site.tel,email:site.email},areaServed:{'@type':'Place',name:'Hendaya (Hendaye)',address:{'@type':'PostalAddress',addressLocality:'Hendaye',addressCountry:'FR'}}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:site.domain+'/'},{'@type':'ListItem',position:2,name:'Hendaya, Francia',item:url}]}
  ]};
  const cards = data.photos.map(photo => `<article class="hendaya-service-case"><a href="${data.route}#instalacion-${photo.installationNumber}"><img src="${asset(photo.thumbnail)}" alt="${esc(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"><h3>${esc(photo.title)}</h3></a>${renderWorkDate(photo)}<p>${esc(photo.caption)}</p><a class="text-link" href="${data.route}#instalacion-${photo.installationNumber}">Ver instalación →</a></article>`).join('');
  const styles = `<style>
.hendaya-service-hero{padding:36px 0 44px;background:#f5f5f7;border-bottom:1px solid var(--line)}.hendaya-service-hero>.wrap{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:40px;align-items:center}.hendaya-service-hero h1{font-size:clamp(34px,4.5vw,54px);line-height:1.1}.hendaya-service-hero p{max-width:650px}.hendaya-service-hero .lead,.hendaya-service-hero .micro{color:var(--muted)}.hendaya-service-hero img{display:block;width:100%;max-height:430px;object-fit:contain;background:#e9e8e4;border-radius:12px}.hendaya-service-hero .actions{margin-top:24px}.hendaya-service-cases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.hendaya-service-case{min-width:0;padding:14px;border:1px solid var(--line);border-radius:12px;background:#fff}.hendaya-service-case img{display:block;width:100%;height:270px;object-fit:contain;background:#f5f5f7}.hendaya-service-case p{font-size:14px;line-height:1.65;color:var(--muted)}.hendaya-service-case h3{font-size:18px;line-height:1.35;margin:12px 0 8px}.hendaya-service-case .work-date{display:block;font-size:12px;color:var(--muted);margin-bottom:10px}.hendaya-service-areas{margin-top:22px;line-height:1.8}.hendaya-service-areas a{text-decoration:underline;text-underline-offset:3px}
@media(max-width:900px){.hendaya-service-cases{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.hendaya-service-hero>.wrap{grid-template-columns:1fr;gap:24px}.hendaya-service-hero img{max-height:360px}.hendaya-service-cases{grid-template-columns:1fr}.hendaya-service-case img{height:auto;max-height:410px}.hendaya-service-hero{padding:24px 0 30px}}
</style>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${url}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${site.domain+asset(featured.file)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Antenas Rapid"><meta name="theme-color" content="#222327"><link rel="icon" type="image/x-icon" sizes="96x96" href="/favicon.ico"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="stylesheet" href="/assets/site.css?v=typography-20261024"><script src="/assets/site.js?v=consulta-francia-20261116" defer></script>${styles}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head><body><a class="skip" href="#contenido">Saltar al contenido</a>${localHeader}<main id="contenido"><nav class="wrap breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Hendaya, Francia</span></nav>
<section class="hendaya-service-hero"><div class="wrap"><div><span class="eyebrow">Hendaya / Hendaye · Francia</span><h1>Antenista en Hendaya, Francia</h1><p class="lead">Instalación y reparación de antenas TDT/TNT, parabólicas, porteros automáticos y videoporteros en viviendas y comunidades de Hendaya. Revisamos señal, cableado y equipos para localizar la avería y preparar la solución.</p><p class="micro"><strong>Urgencias 24 horas</strong> · Consulta disponibilidad para Hendaya.</p><div class="actions"><a class="btn call" href="tel:${site.tel}">Llamar al antenista</a><a class="btn wa" href="${wa}">Consultar por WhatsApp</a><a class="btn light" href="#trabajos">Ver trabajos en Hendaya</a></div></div><a href="${data.route}#instalacion-${featured.installationNumber}" aria-label="Ver el último trabajo en Hendaya"><img src="${asset(featured.file)}" alt="${esc(featured.alt)}" width="${featured.width}" height="${featured.height}" fetchpriority="high"></a></div></section>
${serviceBlock}
${receptionBlock}
${relatedServices}
${technicalBlock}
<section class="section soft" id="trabajos"><div class="wrap"><span class="eyebrow">Trabajos reales en Hendaya</span><h2>${data.photos.length} instalaciones con fotografías</h2><div class="hendaya-service-cases">${cards}</div></div></section>
<section class="section wrap faq" id="preguntas"><h2>Consultas de antenas y porteros en Hendaya</h2><details><summary>¿Reparáis porteros y videoporteros en Hendaya?</summary><p>Sí. Revisamos llamada, audio, imagen y apertura. Indica la marca del equipo y si la avería afecta a una vivienda o a toda la comunidad.</p></details><details><summary>¿Puedo pedir presupuesto antes de cambiar la instalación?</summary><p>Sí. Cuéntanos el problema o el montaje que necesitas y facilita una foto si la tienes. Concretamos la revisión, los materiales y las condiciones de la visita.</p></details><details><summary>¿Necesito una o dos antenas?</summary><p>Lo valoramos según la recepción en tu vivienda y los canales que quieras ver. En nuestros trabajos de Hendaya puedes consultar ejemplos reales de montajes con dos antenas y orientaciones diferentes.</p></details><details><summary>¿Qué información conviene dar al solicitar una revisión?</summary><p>La ubicación, qué canales fallan y si ocurre en todas las televisiones. Una foto de la antena o del equipo instalado también ayuda a preparar la visita.</p></details><details><summary>¿También atendéis Irun y Hondarribia?</summary><p>Sí. Puedes consultar el <a href="/Antenas-Guipuzcoa/irun.html">servicio de antenista en Irun</a> y el <a href="/Antenas-Guipuzcoa/hondarribia.html">servicio en Hondarribia</a>.</p></details></section>
${contactBlock}
<section class="section wrap" id="pueblos-cercanos"><h2>También atendemos en Irun y Hondarribia</h2><nav class="hendaya-service-areas" aria-label="Servicios cercanos"><a href="/Antenas-Guipuzcoa/irun.html">Antenista en Irun</a> · <a href="/Antenas-Guipuzcoa/hondarribia.html">Antenista en Hondarribia</a> · <a href="${data.route}">Trabajos realizados en Hendaya</a></nav></section>
</main>${renderFooter()}<div class="mobilebar"><a href="tel:${site.tel}">☎ ${site.phone}</a><a href="${wa}">WhatsApp</a></div></body></html>`;
  const file = path.join(root, data.serviceRoute.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, html);
  const irun = fs.readFileSync(path.join(root, 'Antenas-Guipuzcoa/irun.html'), 'utf8');
  assert.ok(irun.includes('<h1>') && irun.includes('Irun') && (!checkIrunLink || irun.includes(data.serviceRoute)), 'Irun debe conservar su ficha y enlazar Hendaya');
  console.log('HENDAYA SERVICIO OK: ficha propia en Francia; galería e Irun conservan sus URLs; cuatro casos enlazados.');
}
