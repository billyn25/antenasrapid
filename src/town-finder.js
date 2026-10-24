(() => {
 const form=document.querySelector('[data-town-finder]');if(!form)return;
 const input=form.querySelector('input'),list=form.querySelector('ul'),status=form.querySelector('[role="status"]');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g,' ').trim();
 let data,loading,revision=0;
 const load=()=> {
  if(loading)return loading;
  loading=fetch('/assets/town-finder-index.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(rows=>{data=rows.map(p=>({...p,key:normalize(p.name+' '+p.province),exact:normalize(p.name)}));return data;}).catch(error=>{loading=null;throw error;});
  return loading;
 };
 async function search(submit=false){
  const version=++revision,term=normalize(input.value);list.replaceChildren();list.hidden=true;
  if(term.length<2){status.textContent='Escribe al menos dos letras del pueblo o ciudad.';return;}
  try{await load();}catch{status.textContent='No se ha podido cargar el buscador. Puedes elegir una provincia debajo e intentarlo de nuevo.';return;}
  if(version!==revision)return;
  const words=term.split(' '),matches=data.filter(p=>words.every(w=>p.key.includes(w))).sort((a,b)=>(b.exact===term)-(a.exact===term)||b.exact.startsWith(term)-a.exact.startsWith(term)||a.name.localeCompare(b.name,'es')||a.province.localeCompare(b.province,'es'));
  const exact=matches.filter(p=>p.exact===term);
  if(submit&&(exact.length===1||matches.length===1)){location.assign((exact[0]||matches[0]).url);return;}
  status.textContent=matches.length?`${matches.length} localidades encontradas. ${matches.length>10?'Mostramos las diez primeras; añade la provincia para concretar.':'Elige tu localidad.'}`:'Sin coincidencias. Prueba otro nombre o consulta las provincias de abajo.';
  for(const p of matches.slice(0,10)){
   const li=document.createElement('li'),a=document.createElement('a'),name=document.createElement('strong'),province=document.createElement('small');
   a.href=p.url;name.textContent=p.name;province.textContent=p.province;a.append(name,province);li.append(a);list.append(li);
  }
  list.hidden=!matches.length;
 }
 input.addEventListener('input',()=>search());form.addEventListener('submit',e=>{e.preventDefault();search(true);});
})();
