/*
 * Editorial reception questions, not reports of local incidents or completed jobs.
 * Channel names were checked against the broadcasters on 2026-10-22:
 * https://www.telemadrid.es/corporativo/donde-ver-telemadrid/
 * https://www.cmmedia.es/informacion-corporativa/sintonizanos
 * https://www.eitb.eus/es/grupo-eitb/detalle/5832507/como-ver-etb-navarra-instrucciones-resintonizar-canales/
 * https://www.rtpa.es/tpa-television
 * https://www.cyltv.es/ (La 8 has separate León and Bierzo editions).
 * These regional associations do not certify reception at an individual address.
 * CMM is not assigned to Madrid. León uses La 7 without guessing a La 8 edition.
 * Technical guidance: the Ministry's reception guide and Llega700's FAQ.
 * https://television.digital.gob.es/television-digital/tdt/problemas-recepcion
 * https://www.llega700.es/faq.php
 * Pure module: no filesystem access, network requests or execution side effects.
 */

const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

const normalize = value => String(value ?? '').trim().toLocaleLowerCase('es')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Official directories may sort the article last; questions use normal speech.
export function formatReceptionLocality(value) {
  return String(value ?? '').trim().replace(/^(.+),\s*(El|La|Los|Las)$/, '$2 $1');
}

const provinceAliases = {
  alava: 'alava', araba: 'alava', 'araba-alava': 'alava',
  asturias: 'asturias', 'principado-de-asturias': 'asturias', avila: 'avila',
  bizkaia: 'bizkaia', vizcaya: 'bizkaia', burgos: 'burgos', cantabria: 'cantabria',
  guadalajara: 'guadalajara', guipuzcoa: 'guipuzcoa', gipuzkoa: 'guipuzcoa',
  'la-rioja': 'la-rioja', rioja: 'la-rioja', leon: 'leon', madrid: 'madrid',
  navarra: 'navarra', nafarroa: 'navarra', palencia: 'palencia', salamanca: 'salamanca',
  segovia: 'segovia', soria: 'soria', toledo: 'toledo', valladolid: 'valladolid', zamora: 'zamora'
};

const regionalChannels = {
  madrid: ['Telemadrid', 'laOtra'],
  toledo: ['CMM'], guadalajara: ['CMM'],
  alava: ['ETB1', 'ETB2'], bizkaia: ['ETB1', 'ETB2'], guipuzcoa: ['ETB1', 'ETB2'],
  navarra: ['ETB1', 'ETB2'], asturias: ['TPA'],
  avila: ['La 7', 'La 8 Ávila'], burgos: ['La 7', 'La 8 Burgos'],
  leon: ['La 7'], palencia: ['La 7', 'La 8 Palencia'],
  salamanca: ['La 7', 'La 8 Salamanca'], segovia: ['La 7', 'La 8 Segovia'],
  soria: ['La 7', 'La 8 Soria'], valladolid: ['La 7', 'La 8 Valladolid'],
  zamora: ['La 7', 'La 8 Zamora']
};
const nationalChannels = ['Telecinco', 'La 1', 'Antena 3', 'laSexta'];
const sources = [
  {
    label: 'Cobertura TDT oficial',
    href: 'https://television.digital.gob.es/television-digital/tdt/consulta-la-cobertura-tdt-de-tu-localidad'
  },
  { label: 'Llega700: interferencias móviles', href: 'https://www.llega700.es/faq.php' }
];

function provinceFor({ province, provincePath, path }) {
  const route = String(provincePath || path || '').match(/^\/?Antenas-([^/?#]+)(?:\/|$)/i);
  const key = normalize(route ? route[1] : province);
  return Object.hasOwn(provinceAliases, key) ? provinceAliases[key] : '';
}

function stable(value) {
  let result = 2166136261;
  for (const character of String(value)) result = Math.imul(result ^ character.codePointAt(0), 16777619) >>> 0;
  return result;
}

// Eleven diagnostic situations, plus the requested San Fernando editorial case.
// The wording of each situation stays fixed; this is not synonym substitution.
const timingQuestions = [
  {
    id: 'cortes-por-la-noche',
    title: ({ channel, name }) => `¿Por qué se corta ${channel} por la noche en ${name}?`,
    answer: ({ channel }) => `Los cortes nocturnos pueden estar relacionados con una recepción inestable, conexiones deficientes o interferencias. Si ${channel} falla al anochecer o durante la cena, compara otros canales y anota cuánto tarda en volver. Medir la señal durante el corte y cuando funciona ayuda a distinguir esas posibilidades. El horario permite repetir la comprobación, pero por sí solo no demuestra que la causa sea el 4G o el 5G.`
  },
  {
    id: 'imagen-a-cuadros',
    title: ({ channel, name }) => `¿Por qué ${channel} se queda a cuadros a ratos en ${name}?`,
    answer: ({ channel }) => `La imagen a cuadros puede aparecer cuando la señal llega con errores por una conexión deficiente, pérdidas en el reparto o interferencias. Si ${channel} se congela a ratos, comprueba si también se entrecorta el sonido y si sucede en otra toma durante el mismo episodio. La revisión debe comparar la recepción y la distribución hasta el televisor para localizar dónde se degrada la señal.`
  },
  {
    id: 'falla-al-cabo-de-un-rato',
    title: ({ channel, name }) => `¿Por qué ${channel} empieza bien y deja de verse al rato en ${name}?`,
    answer: ({ channel }) => `Un fallo del receptor, una alimentación inestable o un problema en la distribución pueden explicar que ${channel} funcione al encender y se corte después. Apunta cuánto tiempo pasa y comprueba si otra televisión pierde la imagen a la vez. Si solo falla un aparato, conviene comparar su cable y su toma con una conexión que funcione. Si coinciden varios, merece atención la parte compartida.`
  },
  {
    id: 'cortes-al-mediodia',
    title: ({ channel, name }) => `¿Por qué deja de verse ${channel} al mediodía en ${name}?`,
    answer: ({ channel }) => `Una perturbación de algún aparato eléctrico o una alimentación inestable son posibilidades cuando los cortes coinciden con una rutina diaria. Si ${channel} falla al mediodía, observa si sucede al encender algún equipo y si termina cuando ese equipo deja de usarse. Anota también si ocurre los fines de semana. Comparar esos momentos con una medición de señal ayuda a comprobar la relación sin atribuirla automáticamente a la telefonía móvil.`
  },
  {
    id: 'cortes-por-la-tarde',
    title: ({ channel, name }) => `¿Por qué se corta ${channel} por la tarde en ${name}?`,
    answer: ({ channel }) => `Una recepción con poco margen o variaciones de la señal que llega a la antena pueden explicar que ${channel} se vea por la mañana y falle por la tarde. Conviene comprobar si el cambio afecta a varias viviendas o solo a una toma. Comparar mediciones en la antena y en la distribución, durante ambas franjas, ayuda a separar un problema de recepción de las pérdidas dentro del edificio.`
  }
];

const scopeQuestions = [
  {
    id: 'solo-en-una-toma',
    title: ({ channel, name }) => `¿Por qué ${channel} falla solo en una televisión de mi casa en ${name}?`,
    answer: ({ channel }) => `Un cable defectuoso, una toma deteriorada, pérdidas en el reparto o el propio receptor pueden hacer que ${channel} falle solo en una habitación. Compara ambas televisiones a la misma hora y comprueba que el cable accesible esté bien conectado. Si el problema empezó al mover el aparato o añadir una toma, indícalo. Esa comparación ayuda a revisar primero el tramo de instalación que presenta diferencias.`
  },
  {
    id: 'varios-vecinos',
    title: ({ channel, name }) => `¿Por qué no se ve ${channel} en varias viviendas de ${name}?`,
    answer: ({ channel }) => `Un problema de recepción, de alimentación de la cabecera o del reparto comunitario puede afectar a varias viviendas que comparten antena. Si varios vecinos pierden ${channel}, confirma si ocurre a la vez y si faltan otros canales. Comparar alguna vivienda que todavía lo reciba ayuda a acotar la revisión. El administrador puede reunir esos datos para comprobar los elementos compartidos antes de intervenir dentro de cada piso.`
  },
  {
    id: 'unos-canales-si-otros-no',
    title: ({ channel, name }) => `¿Por qué falla ${channel} en ${name} si otros canales se ven bien?`,
    answer: ({ channel }) => `La recepción y el reparto pueden degradar unas señales más que otras, por conexiones, ajustes de cabecera o interferencias. Si falla ${channel} mientras otros canales mantienen la imagen, apunta cuáles se ven y cuáles no. Compara también otra toma si es posible. Con esa lista se pueden medir las señales afectadas y revisar su distribución antes de cambiar equipos o aumentar la amplificación.`
  }
];

const diagnosisQuestions = [
  {
    id: 'despues-de-resintonizar',
    title: ({ channel, name }) => `¿Por qué no aparece ${channel} después de resintonizar en ${name}?`,
    answer: ({ channel }) => `Una señal insuficiente durante la búsqueda, la configuración de entrada o una lista de favoritos pueden explicar que ${channel} no aparezca. Comprueba que el televisor busque canales de antena y revisa la lista completa. Si antes lo recibías, compara otra televisión conectada a la misma instalación. Si nunca se ha visto en esa vivienda, conviene consultar la cobertura disponible antes de repetir búsquedas o modificar la antena.`
  },
  {
    id: 'posibles-interferencias-moviles',
    title: ({ channel, name }) => `¿Puede el 4G o el 5G causar cortes de ${channel} en ${name}?`,
    answer: ({ channel }) => `Las emisiones móviles pueden interferir en algunas instalaciones de TDT o sobrecargar equipos de amplificación, pero también hay otras causas de pixelación. Si ${channel} pierde señal, hay que comprobar recepción, cableado y amplificación antes de atribuirlo al 4G o al 5G. El horario por sí solo no confirma esa relación. Llega700 orienta sobre estas afectaciones; el filtrado adecuado depende de lo que se encuentre en la instalación.`
  },
  {
    id: 'potencia-y-calidad',
    title: ({ channel, name }) => `¿Por qué ${channel} falla en ${name} aunque la televisión marque mucha señal?`,
    answer: ({ channel }) => `Una señal con interferencias o una amplificación excesiva puede dar problemas aunque el televisor muestre un nivel alto. La potencia y la calidad son medidas distintas. Si ${channel} se congela, compara los indicadores disponibles y comprueba si sucede en otras tomas. La revisión debe medir la señal recibida y su recorrido hasta el aparato para decidir si hace falta ajustar, reparar o filtrar, antes de añadir más amplificación.`
  }
];

const sanFernandoQuestion = {
  id: 'telecinco-san-fernando',
  title: ({ name }) => `¿Por qué falla Telecinco en ${name}?`,
  answer: () => 'Telecinco puede fallar por una recepción insuficiente, conexiones deterioradas, un desajuste de amplificación o interferencias. Si se pixela o aparece «Sin señal» en tu vivienda de San Fernando de Henares, compara otra televisión y anota qué canales fallan a la vez. Indica también si sucede siempre o a ciertas horas. Medir la señal durante el fallo ayuda a localizar el problema y decidir qué parte de la instalación necesita revisión.'
};

export function tvReceptionContent({ name, province = '', provincePath = '', municipioId = '', path = '' } = {}) {
  const place = formatReceptionLocality(name);
  if (!place) throw new TypeError('La sección de recepción necesita el nombre de la localidad o distrito');
  const provinceKey = provinceFor({ province, provincePath, path });
  const identity = String(municipioId ?? '').trim() || String(path).trim() || normalize(place);
  const seed = `${provinceKey}|${identity}`;
  const regional = regionalChannels[provinceKey] || [];
  const nationalStart = stable(`${seed}|nacionales`) % nationalChannels.length;
  const national = nationalChannels.map((_, index) => nationalChannels[(nationalStart + index) % nationalChannels.length]);
  const regionalChannel = regional.length ? regional[stable(`${seed}|autonomico`) % regional.length] : null;
  const selectedChannels = regionalChannel ? [regionalChannel, national[0], national[1]] : national.slice(0, 3);
  const topics = [
    timingQuestions[stable(`${seed}|horario`) % timingQuestions.length],
    scopeQuestions[stable(`${seed}|alcance`) % scopeQuestions.length],
    diagnosisQuestions[stable(`${seed}|diagnostico`) % diagnosisQuestions.length]
  ];
  if (provinceKey === 'madrid' && normalize(place) === 'san-fernando-de-henares') {
    topics[0] = sanFernandoQuestion;
    selectedChannels[0] = 'Telecinco';
    selectedChannels[1] = regionalChannel;
    selectedChannels[2] = national.find(channel => channel !== 'Telecinco');
  }
  const groups = ['horario', 'alcance', 'diagnostico'];
  const questions = topics.map((topic, index) => {
    const context = { name: place, channel: selectedChannels[index] };
    const answerContext = { ...context, channel: context.channel === 'CMM' ? 'CMM (Castilla-La Mancha Media)' : context.channel };
    return { id: topic.id, group: groups[index], channel: context.channel, title: topic.title(context), answer: topic.answer(answerContext) };
  });
  return { name: place, provinceKey, channels: [...selectedChannels], questions, sources: sources.map(source => ({ ...source })) };
}

export function renderTvReception(locality) {
  const content = tvReceptionContent(locality);
  const questions = content.questions.map((question, index) => `<details class="tv-reception-question" data-tv-reception-topic="${esc(question.id)}"${index === 0 ? ' open' : ''}><summary>${esc(question.title)}</summary><p>${esc(question.answer)}</p></details>`).join('');
  const references = content.sources.map(source => `<a href="${esc(source.href)}">${esc(source.label)}</a>`).join(' · ');
  return `<section class="section wrap tv-reception" id="problemas-tdt" data-tv-reception="local-v1" aria-labelledby="tv-reception-title"><div class="tv-reception-layout"><div class="tv-reception-copy"><span class="eyebrow">Cuando falla la televisión</span><h2 id="tv-reception-title">Problemas de TDT en ${esc(content.name)}</h2><p>Si un canal no se ve o se corta, estas comprobaciones ayudan a describir el fallo en tu vivienda o comunidad. Se refieren a televisión recibida por antena.</p><a class="tv-reception-cta" href="#contacto" data-contact-service="tdt" data-contact-reception="true">Consultar mi recepción de TV</a><p class="tv-reception-sources">${references}. La consulta de cobertura es orientativa.</p></div><div class="tv-reception-questions">${questions}</div></div></section>`;
}
