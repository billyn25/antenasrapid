import assert from 'node:assert/strict';

export function renderWorkDate(photo) {
  if (!photo.publishedOn) return '';
  const value = photo.publishedOn;
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, 'Fecha de publicación inválida');
  assert.equal(new Date(value + 'T12:00:00Z').toISOString().slice(0, 10), value);
  const [year, month, day] = value.split('-');
  return `<time class="work-date" datetime="${value}">Publicado el ${day}/${month}/${year}</time>`;
}
