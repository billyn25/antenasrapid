// Service cases, not claims about faults or work carried out in any municipality.
const cases=[
 ['El telefonillo no recibe llamadas','Se compara la llamada en otros pisos y se revisan pulsador, terminal y conexión. Si solo falla una vivienda, se sigue su derivación antes de sustituir elementos comunes.'],
 ['Se escucha solo en un sentido','La prueba separa el audio de la placa y el del telefonillo. Identificar quién oye a quién permite orientar la revisión del micrófono, altavoz, conexiones o terminal.'],
 ['Suena la llamada pero la puerta no abre','Se comprueba la orden de apertura, alimentación y abrepuertas, además del ajuste mecánico. Un cierre desalineado puede necesitar una intervención distinta de un fallo del telefonillo.'],
 ['La imagen del monitor desaparece','Se contrasta si sucede en un monitor o en varios. Cámara, alimentación y transmisión de vídeo se revisan antes de valorar el cambio de pantalla o placa.'],
 ['El videoportero se reinicia al abrir','Se comprueba cómo responde la alimentación durante la apertura y se revisan las conexiones del sistema. El síntoma debe reproducirse para localizar qué elemento provoca la interrupción.'],
 ['Un pulsador llama a la vivienda equivocada','Se identifica la correspondencia entre pulsadores y terminales. La revisión depende del cableado o programación del sistema y de si el fallo comenzó después de una modificación.'],
 ['Renovar un portero antiguo','Se identifican tecnología y elementos existentes para concretar una renovación compatible. El alcance puede incluir placa, terminales o alimentación según el estado y las funciones solicitadas.'],
 ['Cambiar telefonillo por monitor de vídeo','Se estudia si la instalación admite vídeo y qué cambios exige en placa, terminal y alimentación. En comunidades, la decisión depende de la compatibilidad del conjunto.'],
 ['El abrepuertas zumba pero no libera','Se revisan ajuste del resbalón y alineación de la puerta junto con la alimentación. La sustitución se plantea después de distinguir un atasco mecánico de un fallo eléctrico.'],
 ['La placa exterior tiene botones deteriorados','Se valora el estado de pulsadores y conexiones y la disponibilidad de recambios compatibles. La revisión distingue una reparación de la placa de la renovación completa del acceso.'],
 ['Añadir otro terminal en la vivienda','Se comprueba si el sistema admite un terminal adicional y qué alimentación o configuración necesita. El recorrido del cable y las funciones requeridas se concretan antes del montaje.'],
 ['La avería aparece de forma intermitente','Interesa anotar si el fallo es de llamada, audio, imagen o apertura y cuándo ocurre. Se contrastan conexiones y funcionamiento del sistema para localizar una incidencia que no es continua.']
];
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);n=Math.imul(n^(n>>>16),0x45d9f3b);return(n^(n>>>16))>>>0;};
export function localDoorphoneCases(html,code){
 const selected=cases.map((c,i)=>({c,rank:hash(code+':doorphone:'+i)})).sort((a,b)=>a.rank-b.rank).slice(0,3).map(x=>x.c);
 return html.replace(/<section class="doorphones section" id="porteros-videoporteros">[\s\S]*?<\/section>/,section=>{
  section=section.replace(/<p class="section-lead">[\s\S]*?<\/p>/,'<p class="section-lead">Consulta el síntoma de tu portero automático o videoportero.</p>');
  section=section.replace(/<div class="doorphone-work">[\s\S]*?<\/div>/,`<div class="doorphone-work">${selected.map(([title,text],i)=>`<article><span class="work-number" aria-hidden="true">0${i+1}</span><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`);
  return section.replace(/<p class="doorphone-note">[\s\S]*?<\/p>/,'');
 });
}
