import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import data from '../content/hendaya-trabajos.json' with {type: 'json'};
import {galleryDialog, galleryScript, galleryStyle} from './real-work-gallery.mjs';
import {renderFooter} from './footer.mjs';

const domain = 'https://www.antenasrapid.com';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset = file => '/assets/galeria/' + file;
const title = 'Antenas en Hendaya: tres instalaciones con dos antenas | Rapid';
const description = 'Tres instalaciones reales de Antenas Rapid en Hendaya con dos antenas para completar la recepción de canales. Fotos del montaje en cada tejado.';
const style = `<style id="hendaya-case-style">
.hendaya-hero{padding:36px 0 44px;background:var(--paper,#f8f6f3)}.hendaya-hero h1{max-width:900px;font-size:clamp(30px,4.6vw,54px);line-height:1.12;margin:14px 0 20px}.hendaya-hero p{max-width:760px;line-height:1.75}.hendaya-facts{display:flex;gap:12px 28px;flex-wrap:wrap;margin:24px 0 0}.hendaya-facts div{display:grid;gap:4px}.hendaya-facts dt{color:var(--muted);font-size:13px}.hendaya-facts dd{margin:0;font-weight:750}.hendaya-gallery .gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.hendaya-gallery .gallery-open{aspect-ratio:3/4}.hendaya-gallery .gallery-grid img{object-fit:contain}.hendaya-gallery figcaption{font-size:15px;padding:20px}.hendaya-gallery figcaption h3{font-size:20px;line-height:1.3;margin:6px 0 12px}.hendaya-gallery figcaption p{margin:0;line-height:1.7}.hendaya-preview{display:grid;grid-template-columns:160px 1fr;gap:24px;align-items:center;margin:24px 0;padding:20px;background:#f8f6f3;border:1px solid var(--line);border-radius:12px}.hendaya-preview img{display:block;width:100%;height:210px;object-fit:contain}.hendaya-preview h3{margin:6px 0 10px}.hendaya-preview p{line-height:1.65}.hendaya-preview a{text-decoration:underline;text-underline-offset:3px}.hendaya-copy{max-width:850px}.hendaya-copy p,.hendaya-copy li{line-height:1.75}.hendaya-copy li+li{margin-top:8px}
@media(max-width:760px){.hendaya-gallery .gallery-grid{grid-template-columns:1fr;max-width:540px;margin:auto}.hendaya-gallery .gallery-open{aspect-ratio:auto}.hendaya-gallery .gallery-grid img{height:auto;max-height:680px}.hendaya-preview{grid-template-columns:100px 1fr;gap:14px;padding:14px}.hendaya-preview img{height:150px}.hendaya-preview h3{font-size:19px}.hendaya-preview p{font-size:14px}.hendaya-hero{padding:24px 0 30px}}
</style>`;

function cards() {
  return data.photos.map((photo, i) => `<figure id="instalacion-${i+1}"><button class="gallery-open" type="button" data-src="${asset(photo.file)}" data-alt="${esc(photo.alt)}" aria-label="Ampliar la foto de la instalación ${i+1} en Hendaya"><img src="${asset(photo.thumbnail)}" alt="${esc(photo.alt)}" width="${photo.width}" height="${photo.height}" loading="lazy" decoding="async"></button><figcaption><span class="eyebrow">Instalación ${i+1} · Hendaya</span><h3>${esc(photo.title)}</h3><p>${esc(photo.caption)}</p></figcaption></figure>`).join('');
}

export function applyHendayaWork(root) {
  assert.equal(data.photos.length, 3, 'Hendaya: deben publicarse tres instalaciones');
  const dest = path.join(root, 'assets/galeria');
  fs.mkdirSync(dest, {recursive:true});
  for (const photo of data.photos) for (const file of [photo.file, photo.thumbnail]) {
    fs.copyFileSync(path.join('src/trabajos-reales', file), path.join(dest, file));
  }
  const homeFile = path.join(root, 'index.html');
  const home = fs.readFileSync(homeFile, 'utf8');
  const header = home.match(/<header>[\s\S]*?<\/header>/)?.[0];
  assert.ok(header, 'Falta la cabecera compartida de Rapid');
  const localHeader = header.replace(/href="#(?!contacto")([^"]+)"/g, 'href="/#$1"');
  const imageObjects = data.photos.map(photo => ({
    '@type':'ImageObject', contentUrl:domain+asset(photo.file), thumbnailUrl:domain+asset(photo.thumbnail),
    name:photo.title, caption:photo.caption, description:photo.alt, width:photo.width, height:photo.height,
    creator:{'@type':'Person',name:'Roberto Fuentes González'}, creditText:'Roberto Fuentes González · Antenas Rapid',
    copyrightNotice:'Fotografía de Roberto Fuentes González', license:domain+'/aviso-legal.html', acquireLicensePage:domain+'/aviso-legal.html'
  }));
  const schema = {'@context':'https://schema.org','@graph':[
    {'@type':'WebPage','@id':domain+data.route+'#page',url:domain+data.route,name:title,description,inLanguage:'es',isPartOf:{'@id':domain+'/#website'},primaryImageOfPage:imageObjects[0],about:{'@type':'Place',name:'Hendaya (Hendaye)',address:{'@type':'PostalAddress',addressLocality:'Hendaye',addressCountry:'FR'}}},
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:domain+'/'},{'@type':'ListItem',position:2,name:'Instalaciones en Hendaya',item:domain+data.route}]},
    {'@type':'ImageGallery','@id':domain+data.route+'#galeria',name:'Tres instalaciones de dos antenas en Hendaya',image:imageObjects}
  ]};
  const contact = `<section class="section wrap" id="contacto"><div class="contact-panel"><div><h2>Consulta tu instalación en Hendaya</h2><p>Indica qué canales quieres recibir, cuáles faltan y si el problema afecta a todas las tomas. Con esos datos podemos concretar la revisión y la disponibilidad.</p></div><div class="actions"><a class="btn call" href="tel:+34641589394">Llamar 641 589 394</a><a class="btn wa" href="https://wa.me/34641589394?text=${encodeURIComponent('Hola, quiero consultar una instalación de antenas en Hendaya.')}">WhatsApp</a></div></div></section>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${domain+data.route}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${domain+data.route}"><meta property="og:image" content="${domain+asset(data.photos[0].file)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Antenas Rapid"><meta name="theme-color" content="#222327"><link rel="icon" type="image/x-icon" sizes="96x96" href="/favicon.ico"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png"><link rel="stylesheet" href="/assets/site.css?v=typography-20261024"><link rel="stylesheet" href="/assets/regional-contact.css?v=20261015"><script src="/assets/site.js?v=consulta-servicio-20261110" defer></script>${galleryStyle}${style}<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head><body><a class="skip" href="#contenido">Saltar al contenido</a>${localHeader}<main id="contenido"><nav class="wrap breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><span aria-current="page">Instalaciones en Hendaya</span></nav><section class="hendaya-hero"><div class="wrap"><span class="eyebrow">Trabajos reales · Hendaya / Hendaye, Francia</span><h1>Tres instalaciones de dos antenas en Hendaya</h1><p>En estos tres trabajos de Antenas Rapid instalamos dos antenas de televisión en cada ubicación para completar la recepción de canales. Las fotografías muestran los tres montajes realizados en los tejados.</p><a class="btn" href="#galeria">Ver las tres instalaciones</a><dl class="hendaya-facts"><div><dt>Localidad</dt><dd>Hendaya (Hendaye)</dd></div><div><dt>Trabajos documentados</dt><dd>3 instalaciones</dd></div><div><dt>Montaje</dt><dd>2 antenas por instalación</dd></div></dl></div></section><section class="gallery-section hendaya-gallery" id="galeria"><div class="wrap"><div class="gallery-head"><div><span class="eyebrow">Cada foto, un trabajo</span><h2>Dos antenas en cada tejado</h2></div><p>Pulsa una fotografía para ampliarla y ver el montaje completo.<br>Fotografías de Roberto Fuentes González.</p></div><div class="gallery-grid">${cards()}</div></div></section>${galleryDialog}<section class="section wrap"><div class="hendaya-copy"><h2>El objetivo: completar la recepción de televisión</h2><p>Estas tres instalaciones comparten una necesidad: captar el conjunto de canales que se quería recibir. La solución empleada fue un montaje de dos antenas, con orientaciones distintas, sobre un mismo mástil.</p><p>Las fotos permiten comparar cómo se ha dispuesto cada conjunto: la altura de las antenas, su posición respecto a la chimenea y el recorrido visible del cableado. Son tres ubicaciones diferentes dentro de Hendaya.</p><h2>Qué información nos ayuda si faltan canales</h2><ul><li>Los nombres de los canales que faltan y los que sí se ven.</li><li>Si ocurre en todas las televisiones o únicamente en una toma.</li><li>Si ya existe una instalación con una o dos antenas.</li><li>Una foto de la instalación, si la tienes disponible.</li></ul><p>La solución se valora para cada instalación. Estos trabajos muestran la configuración empleada en tres casos concretos; el montaje adecuado depende de lo que se necesite recibir en cada ubicación.</p><p>Consulta también nuestro servicio en <a href="/Antenas-Guipuzcoa/irun.html">Irun</a> y <a href="/Antenas-Guipuzcoa/hondarribia.html">Hondarribia</a>.</p></div></section>${contact}</main>${renderFooter()}<div class="mobilebar"><a href="tel:+34641589394">☎ 641 589 394</a><a href="https://wa.me/34641589394">WhatsApp</a></div>${galleryScript}</body></html>`;
  const file = path.join(root, data.route.slice(1), 'index.html');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, html);

  const preview = `<aside class="hendaya-preview" data-hendaya-work="1"><a href="${data.route}#galeria" aria-label="Ver las tres instalaciones en Hendaya"><img src="${asset(data.photos[0].thumbnail)}" alt="${esc(data.photos[0].alt)}" width="${data.photos[0].width}" height="${data.photos[0].height}" loading="lazy" decoding="async"></a><div><span class="eyebrow">Trabajos reales en Hendaya · Francia</span><h3>Tres instalaciones, dos antenas en cada una</h3><p>Montajes de dos antenas para completar la recepción de canales, con una fotografía de cada instalación.</p><a href="${data.route}#galeria">Ver los tres trabajos de Hendaya →</a></div></aside>`;
  for (const relative of ['index.html','Antenas-Guipuzcoa/index.html','Antenas-Guipuzcoa/irun.html','Antenas-Guipuzcoa/hondarribia.html']) {
    const target = path.join(root, relative);
    let source = fs.readFileSync(target, 'utf8');
    if (source.includes('data-hendaya-work="1"')) continue;
    const gallery = /(<section class="gallery-section" id="galeria"[^>]*><div class="wrap">)/;
    assert.match(source, gallery, relative+': falta galería para enlazar Hendaya');
    source = source.replace(gallery, '$1'+preview).replace('</head>',style+'</head>');
    fs.writeFileSync(target, source);
  }
  const finderFile = path.join(root, 'assets/town-finder-index.json');
  const finder = JSON.parse(fs.readFileSync(finderFile, 'utf8'));
  if (!finder.some(place => place.url === data.route)) {
    finder.push({name:'Hendaya / Hendaye',province:'Francia',url:data.route});
  }
  fs.writeFileSync(finderFile, JSON.stringify(finder));
  fs.writeFileSync(homeFile, fs.readFileSync(homeFile, 'utf8').replace('Busca entre las 3.797 localidades de la web.', 'Busca entre las 3.798 localidades de la web.'));
  console.log('HENDAYA OK: página propia, tres instalaciones y seis imágenes; enlaces desde portada, Gipuzkoa, Irun y Hondarribia; búsqueda por Hendaya y Hendaye.');
}
