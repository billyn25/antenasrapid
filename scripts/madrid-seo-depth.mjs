import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

// Useful troubleshooting information, not fabricated local jobs or offices.
const cases=[
 ['La señal TDT se corta o faltan canales','Si falla un único televisor, indica si las otras tomas funcionan. Si falla toda la vivienda o varios vecinos, conviene comprobar recepción, alimentación y distribución antes de sustituir la antena.','servicios'],
 ['Portero automático que no llama o no abre','Distingue entre llamada, conversación y apertura. Si afecta a varias viviendas, comunícalo: el origen puede estar en la placa, la alimentación o elementos compartidos. No desmontes equipos comunitarios.','porteros-videoporteros'],
 ['Imagen o audio defectuoso en el videoportero','Explica si la imagen aparece negra, se corta el sonido o no responde la apertura. La compatibilidad entre placa, monitor y cableado debe comprobarse antes de elegir un recambio.','porteros-videoporteros']
];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function improveMadrid(html,route){
 if(!/^\/Antenas-Madrid\/[a-z0-9-]+\.html$/.test(route))return html;
 if(html.includes('data-madrid-seo-depth="1"'))return html;
 const heading=html.match(/<h1[^>]*>Antenista en ([^<]+)<\/h1>/i);
 if(!heading)return html; // No speculative locality inference.
 const town=heading[1].replace(/,\s*Madrid$/i,'').trim();
 const marker='<section class="section wrap faq"';
 assert(html.includes(marker),route+': no se encuentra el bloque FAQ');
 const items=cases.map(([title,body,anchor])=>'<article><h3>'+escape(title)+'</h3><p>'+escape(body)+'</p><a href="#'+anchor+'">Ver el servicio relacionado →</a></article>').join('');
 const section='<section class="section wrap madrid-seo-depth" data-madrid-seo-depth="1" aria-label="Orientación sobre averías en '+escape(town)+'"><span class="eyebrow">Antes de pedir una reparación</span><h2>Qué comprobar antes de consultar un antenista en '+escape(town)+'</h2><p>Indica el síntoma, el tipo de instalación y si ocurre en una vivienda o en varias. Estas orientaciones ayudan a preparar el aviso; no sustituyen una revisión técnica.</p><div class="madrid-seo-depth-grid">'+items+'</div><p>Para concretar el presupuesto, consulta el desplazamiento, el diagnóstico, los materiales y los posibles suplementos antes de aceptar la intervención.</p></section><style>.madrid-seo-depth-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:20px 0}.madrid-seo-depth-grid article{min-width:0;padding:20px;border:1px solid #d6dce2;border-radius:12px;background:#fff}.madrid-seo-depth-grid h3{font-size:19px;line-height:1.3;margin:0 0 12px}.madrid-seo-depth-grid p{line-height:1.6}.madrid-seo-depth-grid a{display:inline-block;min-height:44px;padding:10px 0;font-weight:700}@media(max-width:800px){.madrid-seo-depth-grid{grid-template-columns:1fr}}</style>';
 return html.replace(marker,section+marker);
}
export function applyMadridDepth(root='dist'){
 const dir=path.join(root,'Antenas-Madrid');
 let changed=0, verified=0;
 for(const name of fs.readdirSync(dir)){
  if(!name.endsWith('.html')||name==='index.html')continue;
  const file=path.join(dir,name),before=fs.readFileSync(file,'utf8'),route='/Antenas-Madrid/'+name;
  const after=improveMadrid(before,route);
  if(after!==before){fs.writeFileSync(file,after);changed++;}
  if(after.includes('data-madrid-seo-depth="1"'))verified++;
 }
 assert(verified>=200,'Faltan fichas de Madrid reforzadas: '+verified);
 console.log('MADRID SEO: '+verified+' fichas verificadas; '+changed+' nuevas transformaciones.');
 return changed;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)applyMadridDepth();
