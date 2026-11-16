import assert from 'node:assert/strict';

export function renderWorkDate(photo) {
  const value = photo.performedOn ?? photo.publishedOn;
  if (!value) return '';
  const label = photo.performedOn ? 'Realizado el' : 'Publicado el';
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, 'Fecha del trabajo inválida');
  assert.equal(new Date(value + 'T12:00:00Z').toISOString().slice(0, 10), value);
  const [year, month, day] = value.split('-');
  return `<time class="work-date" datetime="${value}">${label} ${day}/${month}/${year}</time>`;
}
