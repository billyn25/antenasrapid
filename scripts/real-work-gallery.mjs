import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const work = JSON.parse(fs.readFileSync(new URL('../content/trabajos-reales.json', import.meta.url), 'utf8'));
const localPhotos = work.localPhotos ?? [];
const regionalPhotos = work.regionalPhotos ?? [];
const domain = 'https://www.antenasrapid.com';
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalized = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const provinceRoutes = ['/Antenas-Bizkaia/','/Antenas-Guipuzcoa/','/Antenas-Cantabria/','/Antenas-Asturias/','/Antenas-Burgos/'];
const asset = name => '/assets/galeria/'+name;
const photoCredit = 'Fotografías de Roberto Fuentes González.';

export function copyWorkPhotos(root='dist') {
  const dest=path.join(root,'assets','galeria');
  fs.mkdirSync(dest,{recursive:true});
  for(const photo of [...work.photos, ...localPhotos, ...regionalPhotos]) for(const name of [photo.file,photo.thumbnail]) {
    fs.copyFileSync(path.join('src','trabajos-reales',name),path.join(dest,name));
  }
}
function photoLocation(photo) {
  if (photo.townPath && photo.town) return `<a class="gallery-place" href="${esc(photo.townPath)}#galeria">${esc(photo.town)}</a>`;
  return photo.province ? `<strong class="gallery-place">${esc(photo.province)}</strong>` : '';
}
const photoCard = photo => `<figure><button class="gallery-open" type="button" data-src="${asset(photo.file)}" data-alt="${esc(photo.alt)} · Antenas Rapid" aria-label="Ampliar: ${esc(photo.alt)}"><img src="${asset(photo.thumbnail)}" alt="${esc(photo.alt)} · Trabajo real de Antenas Rapid" loading="lazy" decoding="async" width="${photo.width}" height="${photo.height}"></button><figcaption>${photoLocation(photo)}${esc(photo.caption ?? photo.alt)}</figcaption></figure>`;
export const galleryDialog = '<dialog class="gallery-lightbox" id="gallery-lightbox" aria-label="Fotografía de trabajo ampliada"><div class="gallery-lightbox-inner"><button class="gallery-lightbox-close" type="button" aria-label="Cerrar imagen">×</button><img src="" alt=""></div></dialog>';
export const galleryStyle = `<style id="rapid-gallery-style">
.gallery-section{padding:48px 0;background:#fff;border-top:1px solid var(--line)}.gallery-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:22px}.gallery-head h2{margin:8px 0 0}.gallery-head p{max-width:650px;margin:0;color:var(--muted);font-size:14px;line-height:1.65}.gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.gallery-grid figure{margin:0;overflow:hidden;border-radius:12px;border:1px solid var(--line);background:#f8f6f3;box-shadow:0 8px 22px rgba(29,31,35,.05)}.gallery-open{display:block;width:100%;aspect-ratio:4/3;padding:0;border:0;background:#eceae6;cursor:zoom-in}.gallery-grid img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .25s ease}.gallery-grid figcaption{padding:12px 14px;color:var(--ink);font-size:13px;line-height:1.5}.gallery-place{display:block;margin-bottom:4px;font-size:15px;font-weight:750}.gallery-place[href]{text-decoration:underline;text-underline-offset:3px}.gallery-open:hover img{transform:scale(1.025)}.gallery-open:focus-visible{outline:3px solid var(--brand);outline-offset:-4px}.gallery-more{margin-top:18px}.gallery-more summary{cursor:pointer;padding:14px 0;min-height:44px;font-weight:750}.gallery-more[open] summary{margin-bottom:12px}.gallery-towns{line-height:1.8;font-size:14px;margin:20px 0 0}.gallery-towns a{color:var(--brand)}.gallery-lightbox{width:min(94vw,1180px);max-width:none;padding:0;border:0;border-radius:12px;background:#111;box-shadow:0 28px 90px rgba(0,0,0,.55)}.gallery-lightbox::backdrop{background:rgba(8,9,12,.88)}.gallery-lightbox-inner{position:relative;display:grid;place-items:center;min-height:200px}.gallery-lightbox img{display:block;max-width:94vw;max-height:88vh;width:auto;height:auto;object-fit:contain}.gallery-lightbox-close{position:absolute;z-index:2;top:12px;right:12px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(20,20,22,.86);color:#fff;font-size:30px;cursor:pointer}.gallery-lightbox-close:hover{background:var(--brand)}
@media(max-width:900px){.gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gallery-head{display:block}.gallery-head p{margin-top:12px}}@media(max-width:600px){.gallery-section{padding:32px 0}.gallery-grid{gap:10px}.gallery-grid figcaption{font-size:12px;padding:10px}.gallery-lightbox img{max-width:94vw;max-height:82vh}.gallery-head h2{font-size:28px}}
</style>`;
export const galleryScript = `<script id="rapid-gallery-script">(()=>{const dialog=document.getElementById('gallery-lightbox');if(!dialog)return;const img=dialog.querySelector('img');let opener;document.querySelectorAll('.gallery-open').forEach(btn=>btn.addEventListener('click',()=>{opener=btn;img.src=btn.dataset.src;img.alt=btn.dataset.alt;dialog.showModal();}));dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{img.removeAttribute('src');if(opener)opener.focus();});})();</script>`;

export function renderWorkGallery({home=false,photos=work.photos,route='/',town='',townLinks='',regional=[],otherPhotos=[]}={}) {
  const intro = home
    ? 'Todas las fotos de esta galería muestran trabajos realizados por Antenas Rapid.'
    : `${town ? `Hemos realizado trabajos en ${esc(town)}. ` : ''}Esta selección muestra trabajos de Antenas Rapid.`;
  const shown=home?photos.slice(0,8):photos;
  const rest=home?photos.slice(8):otherPhotos;
  const moreLabel=home?'Ver más fotos por localidad':'Otros trabajos de Antenas Rapid';
  const homeExamples = home && otherPhotos.length ? `<details class="gallery-more"><summary>Ver más fotos de nuestros trabajos</summary><div class="gallery-grid">${otherPhotos.map(photoCard).join('')}</div></details>` : '';
  const regionalGrid = regional.length ? `<div class="gallery-grid">${regional.map(photoCard).join('')}</div>` : '';
  const regionalBlock = regionalGrid && (home
    ? `<details class="gallery-more"><summary>Ver trabajos de la zona norte</summary><p>Fotografías de nuestros trabajos de antenas, amplificación y porteros en la zona norte.</p>${regionalGrid}</details>`
    : `<div class="gallery-more" data-regional-work><h3>Trabajos de Antenas Rapid en la zona norte</h3><p>Fotografías de nuestros trabajos en distintas localidades de la zona norte.</p>${regionalGrid}</div>`);
  // Preserve the gallery's image URLs and use the confirmed credit in its description.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': domain + route + '#galeria',
    name: 'Trabajos reales de Antenas Rapid',
    description: 'Trabajos de antenas, amplificación y porteros. ' + photoCredit,
    image: [...photos, ...otherPhotos, ...regional].map(photo => domain + asset(photo.file))
  };
  return `<section class="gallery-section" id="galeria" data-real-work="20261106"><div class="wrap"><div class="gallery-head"><div><span class="eyebrow">Instalaciones de Antenas Rapid</span><h2>Trabajos reales de Antenas Rapid</h2></div><p>${intro}<br><strong>${photoCredit}</strong></p></div>${shown.length?`<div class="gallery-grid">${shown.map(photoCard).join('')}</div>`:''}${rest.length?`<details class="gallery-more"><summary>${moreLabel}</summary><div class="gallery-grid">${rest.map(photoCard).join('')}</div></details>`:''}${homeExamples}${regionalBlock}${townLinks}</div></section>${galleryDialog}<script type="application/ld+json" id="real-work-schema">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
}

const serviceExamples = {
  tdt: [['antena-mastil-puebla-de-sanabria.webp', 'Cambio de antena y mástil en Puebla de Sanabria']],
  porteros: [
    ['reparacion-grupo-fonico-tegui-375091-elciego.webp', 'Grupo fónico Tegui en Elciego'],
    ['reparacion-grupo-fonico-tegui-logrono.webp', 'Reparación de portero en Logroño']
  ],
  videoporteros: [['cambio-a-videoportero-llodio-despues.webp', 'Antes y después en Llodio']],
  parabolicas: [['lnb-parabolica-leon.webp', 'Trabajo en una parabólica en León']],
  amplificacion: [['amplificador-puebla-de-sanabria.webp', 'Cambio de amplificador en Puebla de Sanabria']],
  tomas: [['revision-antena-calle-mayor-avila.webp', 'Cambio de antena y cableado en Ávila']]
};

function addServiceExamples(home) {
  for (const [service, examples] of Object.entries(serviceExamples)) {
    const links = examples.map(([file, label]) => {
      const photo = localPhotos.find(item => item.file === file);
      if (!photo?.townPath) throw new Error('Caso de servicio sin galería local: ' + file);
      return `<li><a href="${esc(photo.townPath)}#galeria">${esc(label)}</a></li>`;
    }).join('');
    const card = new RegExp(`(<article class="service-card" id="${service}">[\\s\\S]*?)(</article>)`);
    if (!card.test(home)) throw new Error('Falta tarjeta de servicio: ' + service);
    home = home.replace(card, (_, body, close) => {
      const original = body.replace(/<div class="service-examples">[\s\S]*?<\/div>/, '');
      return `${original}<div class="service-examples"><strong>Trabajos reales</strong><ul>${links}</ul></div>${close}`;
    });
  }
  return home;
}

export function applyLocalWork(root='dist') {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'local-pages-manifest.json'),'utf8'));
  const towns=manifest.filter(p=>work.confirmedTowns.some(n=>normalized(n)===normalized(p.name)));
  if(towns.length!==9)throw new Error('No se han identificado los nueve municipios con trabajos confirmados');
  const municipalPhotos = localPhotos.filter(photo => photo.townPath);
  const exampleTowns = [...new Set(regionalPhotos.map(photo => photo.examplePath))].map(route => {
    const page = manifest.find(entry => entry.path === route);
    if (!page) throw new Error('Ejemplo regional sin página municipal: ' + route);
    return page;
  });
  const localTowns = [...new Map(municipalPhotos.map(photo => [photo.townPath, photo.town])).entries()]
    .map(([townPath, town]) => {
      const page = manifest.find(entry => entry.path === townPath && entry.name === town);
      if (!page) throw new Error('Caso real sin página municipal: ' + townPath);
      return page;
    });
  const linkedTowns = [...new Map([...towns, ...localTowns].map(page => [page.path, page])).values()];
  const links = `<p class="gallery-towns">Hemos realizado trabajos en ${linkedTowns.map(p => `<a href="${esc(p.path)}">${esc(p.name)}</a>`).join(', ')} y otras localidades de nuestra zona de servicio.</p>`;
  const exampleLinks = exampleTowns.length ? `<p class="gallery-towns">Galerías disponibles en ${exampleTowns.map(page => `<a href="${esc(page.path)}#galeria">${esc(page.name)}</a>`).join(', ')}.</p>` : '';
  const homeFile=path.join(root,'index.html');
  let home=fs.readFileSync(homeFile,'utf8');
  const updatedHome=renderWorkGallery({home:true,photos:localPhotos,otherPhotos:work.photos,townLinks:links+exampleLinks,regional:regionalPhotos});
  const schemaPattern=/<script type="application\/ld\+json" id="real-work-schema">[\s\S]*?<\/script>/;
  const homeSchema=updatedHome.match(schemaPattern)[0];
  home=home.replace(/<section class="gallery-section" id="galeria"[^>]*>[\s\S]*?<\/section>\s*<dialog class="gallery-lightbox"[\s\S]*?<\/dialog>/,updatedHome.replace(homeSchema,''));
  home=home.replace(schemaPattern,homeSchema);
  fs.writeFileSync(homeFile,addServiceExamples(home));
  const additionalNames=['Bilbao','Portugalete','Santurtzi','Durango','Mungia','Gernika-Lumo','Donostia/San Sebastián','Irun','Eibar','Zarautz','Errenteria','Hondarribia','Santander','Torrelavega','Castro-Urdiales','Laredo','Santoña','Noja','Gijón','Oviedo','Avilés','Ribadesella','Villaviciosa','Cangas de Onís','Burgos','Miranda de Ebro','Aranda de Duero','Medina de Pomar','Lerma','Briviesca'];
  const sampleTowns=manifest.filter(p=>provinceRoutes.some(route=>p.path.startsWith(route))&&additionalNames.some(n=>normalized(n)===normalized(p.name)));
  if(sampleTowns.length!==additionalNames.length)throw new Error(`No se han identificado las ${additionalNames.length} localidades adicionales: ${sampleTowns.length}`);
  const additional=sampleTowns.filter(p=>!linkedTowns.some(t=>t.path===p.path));
  const localProvinceRoutes = [...new Set(localPhotos.map(photo => photo.provincePath))]
    .filter(route => !provinceRoutes.includes(route));
  const targets = [
    ...provinceRoutes.map(route => ({path: route + 'index.html', route})),
    ...towns.map(page => ({path: page.path.slice(1), route: page.path, town: page.name})),
    ...additional.map(page => ({path: page.path.slice(1), route: page.path, sample: true})),
    ...localTowns.filter(page => !towns.some(town => town.path === page.path))
      .map(page => ({path: page.path.slice(1), route: page.path, town: page.name})),
    ...localProvinceRoutes.map(route => ({path: route + 'index.html', route, localOnly: true}))
  ];
  for (const page of exampleTowns) {
    if (!targets.some(target => target.route === page.path)) {
      targets.push({path: page.path.slice(1), route: page.path, localOnly: true});
    }
  }
  for(const [i,target] of targets.entries()) {
    const file=path.join(root,target.path.replace(/^\//,''));let html=fs.readFileSync(file,'utf8');
    if(html.includes('id="galeria"')) {
      if(!html.includes('data-real-work="20261106"'))throw new Error(target.path+': galería anterior desconocida');
      html=html.replace(/<section class="gallery-section" id="galeria"[^>]*>[\s\S]*?<\/section>\s*<dialog class="gallery-lightbox"[\s\S]*?<\/dialog>/,'').replace(schemaPattern,'').replace(/<style id="rapid-gallery-style">[\s\S]*?<\/style>/,'').replace(/<script id="rapid-gallery-script">[\s\S]*?<\/script>/,'');
    }
    const townPhotos = localPhotos.filter(photo => photo.townPath === target.route);
    const provincePhotos = localPhotos.filter(photo => photo.provincePath === target.route);
    const count = target.localOnly ? 0 : target.sample ? 2 : 4;
    const generalPhotos = Array.from({length: count}, (_, j) => work.photos[(i * 3 + j) % work.photos.length]);
    const existingMadridGallery = html.includes('data-madrid-visuals="1"');
    const photos = existingMadridGallery
      ? [...townPhotos, ...provincePhotos, ...work.photos]
      : townPhotos.length ? townPhotos : [...provincePhotos, ...generalPhotos];
    // Use the same supported section IDs as the final town ordering pass.
    const regional = regionalPhotos.filter(photo => target.route.endsWith('/')
      ? photo.examplePath.startsWith(target.route)
      : photo.examplePath === target.route);
    const featuredCase = ['/Antenas-Madrid/colmenar-de-oreja.html', '/Antenas-Madrid/aranjuez.html', '/Antenas-Madrid/alcobendas.html'].includes(target.route);
    const otherPhotos = featuredCase ? photos.slice(townPhotos.length) : [];
    const gallery=renderWorkGallery({photos:featuredCase ? townPhotos : photos,route:target.route,town:target.town,regional,otherPhotos}).replace(/<script type="application\/ld\+json" id="real-work-schema">([\s\S]*?)<\/script>/,(_,json)=>{html=html.replace('</head>',`<script type="application/ld+json" id="real-work-schema">${json}</script></head>`);return '';});
    const marker=html.match(/<section\b[^>]*id="preguntas"[^>]*>/)?.[0];
    if(!marker)throw new Error(target.path+': falta el punto de inserción');
    html=html.replace(marker,gallery+marker).replace('</head>',galleryStyle+'</head>').replace('</body>',galleryScript+'</body>');
    fs.writeFileSync(file,html);
  }
  console.log(`TRABAJOS REALES OK: ${work.photos.length + localPhotos.length + regionalPhotos.length} fotografías propias; portada, ${provinceRoutes.length + localProvinceRoutes.length} provincias y ${linkedTowns.length + additional.length} municipios.`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyLocalWork();
