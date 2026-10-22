import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTvReception, tvReceptionContent, formatReceptionLocality} from '../scripts/tv-reception.mjs';

const locality = (name, province, provincePath, municipioId) => ({name, province, provincePath, municipioId});

test('los artículos del directorio se leen como nombres naturales y los distritos se conservan', () => {
  for (const [source, expected] of [['Espinar, El', 'El Espinar'], ['Adrada, La', 'La Adrada'], ['Corrales de Buelna, Los', 'Los Corrales de Buelna'], ['Navas del Marqués, Las', 'Las Navas del Marqués'], ['Chamberí, Madrid', 'Chamberí, Madrid'], ['Donostia / San Sebastián', 'Donostia / San Sebastián']]) {
    assert.equal(formatReceptionLocality(source), expected);
  }
  const questions = tvReceptionContent(locality('Espinar, El', 'Segovia', '/Antenas-Segovia/', '40076')).questions;
  assert(questions.every(question => question.title.includes('en El Espinar')));
  assert(!questions.some(question => question.title.includes('Espinar, El')));
});

test('las preguntas regionales respetan la comunidad y la edición provincial', () => {
  const cases = [
    [locality('El Álamo', 'Madrid', '/Antenas-Madrid/', '28004'), /Telemadrid|laOtra/],
    [locality('Illescas', 'Toledo', '/Antenas-Toledo/', '45081'), /Castilla-La Mancha Media|CMM/],
    [locality('Azuqueca de Henares', 'Guadalajara', '/Antenas-Guadalajara/', '19046'), /Castilla-La Mancha Media|CMM/],
    [locality('Zalla', 'Bizkaia', '/Antenas-Bizkaia/', '48096'), /ETB[12]/],
    [locality('Tolosa', 'Gipuzkoa', '/Antenas-Guipuzcoa/', '20071'), /ETB[12]/],
    [locality('Amurrio', 'Álava', '/Antenas-Alava/', '01002'), /ETB[12]/],
    [locality('Tudela', 'Navarra', '/Antenas-Navarra/', '31232'), /ETB[12]/],
    [locality('El Espinar', 'Segovia', '/Antenas-Segovia/', '40076'), /La 7|La 8 Segovia/],
    [locality('Lerma', 'Burgos', '/Antenas-Burgos/', '09194'), /La 7|La 8 Burgos/],
    [locality('Ponferrada', 'León', '/Antenas-Leon/', '24115'), /La 7/],
    [locality('Gijón', 'Asturias', '/Antenas-Asturias/', '33024'), /TPA/]
  ];
  for (const [place, expected] of cases) {
    const questions = tvReceptionContent(place).questions;
    const text = questions.map(item => `${item.title} ${item.answer}`).join(' ');
    assert.match(text, expected, place.province);
    if (place.province !== 'Madrid') assert.doesNotMatch(text, /Telemadrid|laOtra/, place.province);
    if (!['Toledo', 'Guadalajara'].includes(place.province)) assert.doesNotMatch(text, /Castilla-La Mancha Media|\bCMM\b/, place.province);
    if (place.province === 'León') assert.doesNotMatch(text, /La 8 León|La 8 Bierzo/, 'No atribuir una edición local a toda la provincia de León');
  }
});

test('La Rioja y Cantabria no heredan autonómicas de una comunidad vecina', () => {
  for (const place of [locality('Haro', 'La Rioja', '/Antenas-La-Rioja/', '26071'), locality('Reinosa', 'Cantabria', '/Antenas-Cantabria/', '39059')]) {
    const questions = tvReceptionContent(place).questions;
    const text = questions.map(item => `${item.title} ${item.answer}`).join(' ');
    assert.doesNotMatch(text, /Telemadrid|laOtra|ETB[12]|\bTPA\b|La 7|La 8|\bCMM\b/);
    assert.match(text, /Telecinco|La 1|Antena 3|laSexta/);
  }
});

test('la consulta solicitada de San Fernando explica posibilidades sin inventar una incidencia', () => {
  const data = tvReceptionContent(locality('San Fernando de Henares', 'Madrid', '/Antenas-Madrid/', '28130'));
  assert.equal(data.questions[0].title, '¿Por qué falla Telecinco en San Fernando de Henares?');
  assert.match(data.questions.map(item => item.title).join(' '), /Telemadrid|laOtra/);
  assert.doesNotMatch(JSON.stringify(data.questions), /hemos reparado|ayer atendimos|cliente satisfecho|avería general confirmada/i);
});

test('la guía escapa el nombre y conserva un contacto interno sin reseñas ni llamadas repetidas', () => {
  const place = locality('Pueblo <script>alert(1)</script> & vecinos', 'Madrid', '/Antenas-Madrid/', '28004');
  const html = renderTvReception(place);
  assert(!html.includes('<script>'));
  assert(html.includes('&lt;script&gt;'));
  assert.equal((html.match(/id="problemas-tdt"/g) || []).length, 1);
  assert.equal((html.match(/<details\b/g) || []).length, 3);
  assert.equal((html.match(/href="#contacto"/g) || []).length, 1);
  assert(html.includes('data-contact-service="tdt"'));
  assert.doesNotMatch(html, /href="tel:|href="https:\/\/wa\.me\/|AggregateRating|"@type":"Review"/);
});
