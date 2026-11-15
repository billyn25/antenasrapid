import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {htmlFiles} from './canonical-urls.mjs';
export function applyImportantSeoFixes(root) {
 let repaired=0;
 for(const file of htmlFiles(root)) {
  let h=fs.readFileSync(file,'utf8');
  h=h.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(_,a,raw,b)=>{
   const data=JSON.parse(raw);
   function walk(x){
    if(!x||typeof x!=='object')return;
    if(x['@type']==='Service'&&x.telephone){
     x.provider ??= {'@type':'Organization',name:'Antenas Rapid',url:'https://www.antenasrapid.com/'};
     x.provider.telephone ??= x.telephone;
     delete x.telephone;repaired++;
    }
    assert(!(x['@type']==='Service'&&'telephone' in x));
    Object.values(x).forEach(walk);
   }
   walk(data);return a+JSON.stringify(data).replace(/</g,'\\u003c')+b;
  });
  if(['cookies.html','privacidad.html','aviso-legal.html'].includes(path.relative(root,file)))h=h.replace('content="noindex,nofollow"','content="noindex,follow"');
  fs.writeFileSync(file,h);
 }
 assert.equal(repaired,3818,'Debe corregirse el teléfono en los 3797 municipios y 21 distritos');
 const old=path.join(root,'Antenas-Bizkaia/abanto-zierbena.html');
 assert(fs.existsSync(path.join(root,'Antenas-Bizkaia/abanto-y-ciervana-abanto-zierbena.html')));
 fs.unlinkSync(old);
 const redirects=path.join(root,'_redirects');
 const existing=fs.existsSync(redirects)?fs.readFileSync(redirects,'utf8'):'';
 const target='/antenas-bizkaia/abanto-y-ciervana-abanto-zierbena';
 fs.writeFileSync(redirects,['/antenas-bizkaia/abanto-zierbena','/antenas-bizkaia/abanto-zierbena.html','/Antenas-Bizkaia/abanto-zierbena.html'].map(p=>`${p} ${target} 301!`).join('\n')+'\n'+existing);
 console.log('CORRECCIONES SEO OK: 3818 Service válidos para telephone; legales noindex,follow; alias de Abanto redirigido.');
}
