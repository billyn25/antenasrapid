import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');

// Favicon cuadrado derivado del símbolo del logotipo aprobado; sin dependencias de red.
const favicon=Buffer.from(fs.readFileSync(path.resolve('src','favicon.png.b64'),'utf8').trim(),'base64');
if(favicon.length<24||!favicon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||favicon.readUInt32BE(16)!==96||favicon.readUInt32BE(20)!==96){
  throw new Error('Favicon: se requiere el PNG original cuadrado de 96 x 96.');
}
fs.writeFileSync(path.join(root,'favicon.png'),favicon);
// ICO con PNG incrustado (96 x 96), compartiendo exactamente el mismo símbolo.
const icoHeader=Buffer.alloc(22);
icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(1,4);
icoHeader[6]=96;icoHeader[7]=96;icoHeader.writeUInt16LE(1,10);icoHeader.writeUInt16LE(32,12);
icoHeader.writeUInt32LE(favicon.length,14);icoHeader.writeUInt32LE(22,18);
fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([icoHeader,favicon]));
const faviconLinks='<link rel="icon" type="image/x-icon" sizes="96x96" href="/favicon.ico"><link rel="icon" type="image/png" sizes="96x96" href="/favicon.png">';


function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&middot;/gi, ' · ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const forbiddenVisible = [
  /vista previa/i,
  /modo de revisión/i,
  /versión de revisión/i,
  /pendiente(?:s)? de revisión/i,
  /página de prueba/i,
  /página local generada/i,
  /generada para esa localidad/i,
  /selección parcial/i,
  /web actual permanece/i,
  /no sustituye la web actual/i,
  /\bnoindex\b/i,
  /\bpreview\b/i,
  /\bdemo\b/i,
  /\btest\b/i
];

let changed = 0;
for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  if(!html.includes('href="/favicon.png"')) html=html.replace('</head>',faviconLinks+'</head>');

  // Ningún texto interno de desarrollo debe quedar visible para el cliente.
  // El noindex técnico de la preview se conserva únicamente en <head>/cabeceras.
  html = html
    .replace(/<div class="preview">[\s\S]*?<\/div>/gi, '')
    .replaceAll('Los nombres enlazados ya disponen de una página de prueba.', 'Selecciona tu municipio para consultar los servicios disponibles.')
    .replaceAll('Buscar en esta selección', 'Buscar municipio')
    .replaceAll(' localidades en esta selección', ' municipios disponibles')
    .replaceAll('Cada enlace abre una página local generada para esa localidad. La web continúa en modo de revisión y noindex.', 'Selecciona un municipio para consultar sus servicios de antenas, porteros y videoporteros.')
    .replaceAll('Cada enlace abre una página local generada para esa localidad.', 'Selecciona un municipio para consultar sus servicios de antenas, porteros y videoporteros.')
    .replaceAll('La web continúa en modo de revisión y noindex.', '')
    .replace(/<p class="notice">[^<]*(?:vista previa|modo de revisión|noindex|página de prueba|selección parcial|web actual|generada para esa localidad)[^<]*<\/p>/gi, '')
    .replace(/<details><summary>Información de esta vista previa y privacidad<\/summary><p>[\s\S]*?<\/p><\/details>/gi, '')
    .replaceAll('Antenas Rapid · Versión de revisión. La web actual permanece en su alojamiento. Fotografías y listado completo de localidades pendientes de revisión.', 'Antenas Rapid · Propiedad de R.F.G. · 641 589 394')
    .replaceAll('Página no incluida en esta vista previa', 'Página no disponible')
    .replaceAll('El inventario de la renovación está en revisión. Esto no indica que la página se haya eliminado de la web actual.', 'La dirección solicitada no está disponible. Puedes volver al inicio o contactar con Antenas Rapid.');

  const visible = visibleText(html);
  for (const pattern of forbiddenVisible) {
    if (pattern.test(visible)) {
      const rel = path.relative(root, file).split(path.sep).join('/');
      throw new Error(`${rel}: queda texto interno visible: ${pattern}`);
    }
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed++;
  }
}

// Bloque final de cifras de la portada, calculado desde los datos reales del build.
const manifestFile = path.join(root, 'local-pages-manifest.json');
const servicesFile = path.resolve('content', 'services.json');
if (!fs.existsSync(manifestFile)) throw new Error('Falta local-pages-manifest.json para generar las cifras de portada');
if (!fs.existsSync(servicesFile)) throw new Error('Falta content/services.json para generar las cifras de portada');
const localPages = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const services = JSON.parse(fs.readFileSync(servicesFile, 'utf8'));
const provinceSegments = new Set(localPages.map(page => String(page.path || '').replace(/^\//, '').split('/')[0]).filter(Boolean));
const stats = { towns: localPages.length, provinces: provinceSegments.size, services: services.length };
const featuredByProvince={
  'Antenas-Guadalajara':['Guadalajara','Azuqueca de Henares','Alovera','Cabanillas del Campo','Marchamalo','El Casar','Sigüenza','Molina de Aragón'],
  'Antenas-Toledo':['Toledo','Talavera de la Reina','Illescas','Seseña','Torrijos','Ocaña','Consuegra','Sonseca'],
  'Antenas-Madrid':['Madrid','Alcalá de Henares','Móstoles','Alcorcón','Getafe','Leganés','Torrejón de Ardoz','Alcobendas'],
  'Antenas-Alava':['Vitoria-Gasteiz','Laudio / Llodio','Amurrio','Agurain / Salvatierra','Laguardia','Alegría-Dulantzi','Artziniega','Elciego'],
  'Antenas-Bizkaia':['Bilbao','Barakaldo','Getxo','Portugalete','Santurtzi','Durango','Gernika-Lumo','Mungia'],
  'Antenas-Burgos':['Burgos','Miranda de Ebro','Aranda de Duero','Briviesca','Medina de Pomar','Lerma','Belorado','Salas de los Infantes'],
  'Antenas-Cantabria':['Santander','Torrelavega','Castro-Urdiales','Camargo','Laredo','Santoña','Noja','Reinosa'],
  'Antenas-Guipuzcoa':['Donostia / San Sebastián','Irun','Errenteria','Eibar','Zarautz','Hernani','Hondarribia','Beasain'],
  'Antenas-La-Rioja':['Logroño','Calahorra','Arnedo','Haro','Alfaro','Nájera','Santo Domingo de la Calzada','Lardero'],
  'Antenas-Leon':['León','Ponferrada','San Andrés del Rabanedo','Astorga','La Bañeza','Villablino','Bembibre','Valencia de Don Juan'],
  'Antenas-Navarra':['Pamplona / Iruña','Tudela','Barañáin / Barañain','Estella-Lizarra','Tafalla','Burlada / Burlata','Zizur Mayor / Zizur Nagusia','Villava / Atarrabia'],
  'Antenas-Palencia':['Palencia','Aguilar de Campoo','Guardo','Venta de Baños','Villamuriel de Cerrato','Cervera de Pisuerga','Carrión de los Condes','Dueñas'],
  'Antenas-Salamanca':['Salamanca','Béjar','Ciudad Rodrigo','Santa Marta de Tormes','Peñaranda de Bracamonte','Villamayor','Guijuelo','Alba de Tormes'],
  'Antenas-Segovia':['Segovia','Cuéllar','El Espinar','San Ildefonso','Cantalejo','Nava de la Asunción','Riaza','Carbonero el Mayor'],
  'Antenas-Soria':['Soria','Almazán','El Burgo de Osma','Ólvega','San Esteban de Gormaz','Ágreda','San Leonardo de Yagüe','Golmayo'],
  'Antenas-Valladolid':['Valladolid','Laguna de Duero','Medina del Campo','Arroyo de la Encomienda','Tordesillas','Tudela de Duero','Íscar','Peñafiel'],
  'Antenas-Zamora':['Zamora','Benavente','Toro','Puebla de Sanabria','Morales del Vino','Villaralbo','Fuentesaúco','Fermoselle'],
  'Antenas-Asturias':['Gijón','Oviedo','Avilés','Siero','Langreo','Mieres','Llanes','Ribadesella'],
  'Antenas-Avila':['Ávila','Arévalo','Arenas de San Pedro','Las Navas del Marqués','Candeleda','El Tiemblo','Sotillo de la Adrada','Cebreros']
};
const normTown=v=>String(v||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const localByProvince=new Map();
for(const page of localPages){const seg=String(page.path||'').replace(/^\//,'').split('/')[0];if(!localByProvince.has(seg))localByProvince.set(seg,[]);localByProvince.get(seg).push(page);}
const featuredCards=[...provinceSegments].sort((a,b)=>a.localeCompare(b,'es')).map(seg=>{
 const pagesFor=localByProvince.get(seg)||[],byName=new Map(pagesFor.map(p=>[normTown(p.name),p]));
 const requested=featuredByProvince[seg]||[];
 const chosen=requested.map(n=>byName.get(normTown(n))).filter(Boolean).slice(0,8);
 const chosenPaths=new Set(chosen.map(p=>p.path));
 const extra=pagesFor.filter(p=>!chosenPaths.has(p.path)).sort((a,b)=>a.name.localeCompare(b.name,'es',{sensitivity:'base'})).slice(0,12);
 const provinceName=seg.replace(/^Antenas-/,'').replace('Guipuzcoa','Gipuzkoa').replace('Alava','Álava').replaceAll('-',' ');
 if(chosen.length<4) throw new Error(`Portada: faltan pueblos destacados válidos para ${seg} (${chosen.length}/8)`);
 if(extra.length<12) throw new Error(`Portada: faltan pueblos adicionales válidos para ${seg} (${extra.length}/12)`);
 return `<article class="featured-province"><h3><a href="/${seg}/">${provinceName}</a></h3><div class="featured-towns">${chosen.map(p=>`<a href="${p.path}">${p.name}</a>`).join('')}</div><details class="featured-more"><summary>Más pueblos con servicio</summary><div class="featured-more-links">${extra.map(p=>`<a href="${p.path}">${p.name}</a>`).join('')}</div></details><a class="featured-all" href="/${seg}/">Ver todos los pueblos →</a></article>`;
}).join('');
const featuredHtml=`<section class="featured-localities" id="pueblos-destacados"><div class="wrap"><span class="eyebrow">Localidades principales</span><h2>Pueblos y ciudades con servicio</h2><p class="featured-lead">Accesos directos a algunas de las localidades principales de cada provincia. Consulta la provincia para ver el listado completo.</p><div class="featured-province-grid">${featuredCards}</div></div></section>`;

const statsHtml = `<section class="rapid-stats" id="rapid-stats" aria-labelledby="rapid-stats-title"><div class="wrap"><h2 id="rapid-stats-title">Antenas Rapid, por localidades.</h2><div class="rapid-stats-grid"><article><strong>${stats.towns.toLocaleString('es-ES')}</strong><span>Municipios en el directorio</span></article><article><strong>${stats.provinces}</strong><span>Provincias</span></article><article><strong>${stats.services}</strong><span>Servicios técnicos</span></article></div></div></section>`;
const homeFile = path.join(root, 'index.html');
let homeHtml = fs.readFileSync(homeFile, 'utf8');
homeHtml=homeHtml.replace('<section class="hero">','<section class="hero home-clean-hero">');
if (!homeHtml.includes('id="pueblos-destacados"')) { const marker='<section class="section wrap faq" id="preguntas">'; if(!homeHtml.includes(marker)) throw new Error('Portada: no se encontró el punto para insertar pueblos destacados'); homeHtml=homeHtml.replace(marker,featuredHtml+marker); }
if (!homeHtml.includes('id="rapid-stats"') && homeHtml.includes('<footer class="footer">')) {
  homeHtml = homeHtml.replace('<footer class="footer">', `${statsHtml}<footer class="footer">`);
} else if (!homeHtml.includes('id="rapid-stats"')) {
  throw new Error('No se encontró el footer para insertar las cifras de portada');
}
fs.writeFileSync(homeFile, homeHtml);

// Cierre responsive: en móvil ningún bloque principal depende de scroll horizontal
// y evitamos repetir la misma llamada a la acción en el hero y en la barra fija.
const cssFile = path.join(root, 'assets', 'site.css');
const mobileOverflowFix = `

/* Hero aprobado Antenas Rapid */
.home-clean-hero{position:relative;isolation:isolate;overflow:hidden;background:#07121d;border-bottom:4px solid var(--brand)}
.home-clean-hero::before{content:''!important;display:block!important;position:absolute!important;inset:0!important;z-index:-1!important;width:auto!important;height:auto!important;right:0!important;top:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:url('/assets/hero-antenasrapid-HQ.jpg') center center/cover no-repeat!important}
.home-clean-hero .hero-inner{display:block;min-height:clamp(420px,34vw,490px);padding-block:32px}
.home-clean-hero .hero-copy{position:relative;z-index:2;width:min(700px,58%)}
.home-clean-hero .service-desk{display:none!important}
.home-clean-hero h1{font-size:clamp(38px,4vw,56px);max-width:690px;margin:12px 0 16px}
.home-clean-hero .service-statement{max-width:650px;font-size:19px;margin-bottom:12px}.home-clean-hero .lead{max-width:610px;color:#eef0f2;font-size:15px;line-height:1.6;margin-bottom:20px}
.home-clean-hero .hero-tags{margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,.22);max-width:650px}
@media(max-width:900px){.home-clean-hero::before{background-position:62% 50%!important}.home-clean-hero .hero-copy{width:min(650px,70%)}}
@media(max-width:640px){.home-clean-hero::before{background-position:72% center!important}.home-clean-hero::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(3,10,17,.38) 0%,rgba(3,10,17,.48) 58%,rgba(3,10,17,.62) 100%)}.home-clean-hero .hero-inner{min-height:0;padding-block:26px}.home-clean-hero .hero-copy{width:100%;text-shadow:0 2px 9px rgba(0,0,0,.9)}.home-clean-hero h1{font-size:clamp(34px,9vw,40px);color:#fff}.home-clean-hero .service-statement{font-size:17px;color:#fff}.home-clean-hero .lead{font-size:15px;color:#fff}.home-clean-hero .micro{color:#f2f3f5}.home-clean-hero .hero-tags{padding:10px 12px;background:rgba(3,10,17,.44);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff}}

/* Cierre móvil sin scroll lateral */
.featured-localities{padding:52px 0;background:#f5f6f7;border-top:1px solid #e2e3e5}.featured-localities h2{margin:7px 0 8px}.featured-lead{max-width:820px;margin:0 0 24px;color:#5d6066}.featured-province-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}.featured-province{min-width:0;padding:20px;border:1px solid #dedfe2;background:#fff;border-radius:12px}.featured-province h3{margin:0 0 12px;font-size:20px}.featured-province h3 a{color:#202126}.featured-towns{display:flex;flex-wrap:wrap;gap:7px}.featured-towns a{padding:7px 9px;border:1px solid #e0e1e4;background:#f8f8f9;border-radius:7px;font-size:13px;font-weight:700}.featured-all{display:inline-block;margin-top:14px;color:#c91f25;font-size:13px;font-weight:900}.featured-more{margin-top:12px;border-top:1px solid #ececef;padding-top:10px}.featured-more summary{cursor:pointer;color:#4e5157;font-size:12px;font-weight:900}.featured-more-links{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.featured-more-links a{font-size:12px;color:#555a61;text-decoration:underline;text-underline-offset:2px}
.rapid-stats{padding:22px 0;background:#191b20;color:#fff;border-top:3px solid var(--brand)}
.rapid-stats>.wrap{display:flex;align-items:center;justify-content:space-between;gap:24px;padding-bottom:22px;border-bottom:1px solid #34363d}
.rapid-stats h2{margin:0;color:#d5d7dd;font-size:18px;font-weight:600;line-height:1.3;letter-spacing:-.3px}
.rapid-stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:44px}
.rapid-stats-grid article{min-width:0}.rapid-stats-grid strong{display:block;color:#fff;font-size:27px;line-height:1;font-weight:800;letter-spacing:-.04em}.rapid-stats-grid span{display:block;margin-top:7px;color:#a8abb4;font-size:11px;line-height:1.4}
.rapid-stats+.footer{border-top:0;padding-top:10px}
@media(max-width:760px){
  .featured-localities{padding:38px 0}.featured-province-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .rapid-stats{padding:20px 0 14px}.rapid-stats>.wrap{display:block;padding-bottom:18px}.rapid-stats h2{font-size:16px;margin-bottom:18px}.rapid-stats-grid{gap:16px}.rapid-stats-grid strong{font-size:25px}.rapid-stats-grid span{font-size:10px}.rapid-stats+.footer{padding-top:10px}
}
@media(max-width:640px){
  .hero .actions{display:none!important}
}
@media(max-width:480px){
  .featured-province-grid{grid-template-columns:1fr}.featured-province{padding:17px}.featured-localities{padding:32px 0}
  .strip .wrap{overflow-x:visible!important}
}
`;
if (fs.existsSync(cssFile)) {
  let css = fs.readFileSync(cssFile, 'utf8');
  css = css.replace(/\n\n\/\* Cierre móvil sin scroll lateral \*\/[\s\S]*$/m, '');
  fs.writeFileSync(cssFile, css + mobileOverflowFix);
}

console.log(`COPY FINAL OK: ${changed} HTML limpiados; 0 textos visibles de preview/desarrollo y móvil cerrado.`);
