import site from '../config/site.json' with { type: 'json' };
import pages from '../content/pages.json' with { type: 'json' };
import { brandMark } from './logo.mjs';
import { regionalFooterContacts } from './madrid-contact.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const legalLinks = '<nav class="legal-links" aria-label="Información legal"><a href="/aviso-legal.html">Aviso legal</a><span class="legal-sep" aria-hidden="true">·</span><a href="/privacidad.html">Privacidad y RGPD</a><span class="legal-sep" aria-hidden="true">·</span><a href="/cookies.html">Cookies</a></nav>';

// Esquema de conexiones, sin contornos geográficos. Los destinos proceden del
// mismo inventario preparado que utiliza el resto de la web.
const networkRows = [
  ['Asturias', 'Cantabria', 'Bizkaia', 'Gipuzkoa'],
  ['León', 'Palencia', 'Álava', 'Navarra'],
  ['Zamora', 'Valladolid', 'Burgos', 'La Rioja'],
  ['Salamanca', 'Ávila', 'Segovia', 'Soria'],
  [null, 'Toledo', 'Madrid', 'Guadalajara']
];

function networkPreview() {
  const rows = networkRows.map((row, y) => ({ y: 12 + y * 22, points: row.flatMap((name, x) => name ? [24 + x * 96] : []) }));
  return `<svg class="footer-network-preview" viewBox="0 0 340 112" width="340" height="112" fill="none" aria-hidden="true" focusable="false"><g stroke="#79313d" stroke-width="1"><path d="M120 12V100"/>${rows.map(row => `<path d="M${row.points[0]} ${row.y}H${row.points.at(-1)}"/>`).join('')}</g><g fill="#191b20" stroke="#e9697a" stroke-width="1.5">${rows.flatMap(row => row.points.map(x => `<circle cx="${x}" cy="${row.y}" r="3"/>`)).join('')}</g><circle cx="120" cy="56" r="9" stroke="#e9697a" opacity=".2"/></svg>`;
}

function provinceNetwork(provinces) {
  const byName = new Map(provinces.map(p => [p.name, p]));
  const stations = networkRows.flatMap((row, y) => row.flatMap((name, x) => {
    const province = byName.get(name);
    if (!province) return [];
    byName.delete(name);
    return [{ ...province, x: x + 1, y: y + 1 }];
  }));
  // Las provincias nuevas siguen siendo accesibles aunque aún no tengan
  // una posición diseñada en el esquema.
  for (const province of byName.values()) stations.push({ ...province });
  return `<nav class="footer-network" aria-labelledby="rapid-network-title"><div class="footer-network-heading"><div><p class="footer-kicker">Servicio por localidades</p><h2 id="rapid-network-title">Encuentra tu provincia.</h2></div><span class="footer-network-count">${provinces.length}<small>provincias</small></span></div><p class="footer-network-intro">Elige tu zona y busca tu pueblo.</p><details class="footer-network-details" data-footer-network open><summary>${networkPreview()}<span class="footer-network-disclosure"><span class="footer-network-show">Ver las ${provinces.length} provincias</span><span class="footer-network-hide">Ocultar provincias</span><span class="footer-network-plus" aria-hidden="true"></span></span></summary><div class="footer-network-map"><ol class="footer-provinces">${stations.map(p => `<li${p.x ? ` style="--station-col:${p.x};--station-row:${p.y}"` : ''}><a href="${esc(p.path)}" aria-label="Ver pueblos de ${esc(p.name)}"><span class="footer-node" aria-hidden="true"></span><span class="footer-station-name">${esc(p.name)}</span><span class="footer-station-arrow" aria-hidden="true">↗</span></a></li>`).join('')}</ol></div></details><p class="footer-network-note"><span aria-hidden="true"></span>Indica tu localidad al contactar y consulta disponibilidad.</p></nav>`;
}

export function renderFooter() {
  const provinces = pages.filter(p => p.type === 'province');
  const logo = brandMark()
    .replaceAll('rapid-logo-contrast', 'rapid-footer-logo-contrast')
    .replace('class="rapid-brand-logo"', 'class="rapid-footer-logo"')
    .replace('fetchpriority="high"', 'loading="lazy"');
  return `<footer class="footer"><div class="wrap rapid-footer-shell" data-footer-design="rapid-network-v1"><div class="rapid-footer-layout"><div class="rapid-footer-info"><a class="rapid-footer-brand" href="/" aria-label="${esc(site.brand)}, inicio">${logo}</a><p class="rapid-footer-description">Antenas, porteros y videoporteros.<br>Tu instalación empieza con una conversación.</p><div class="rapid-footer-contacts">${regionalFooterContacts()}</div></div>${provinceNetwork(provinces)}</div><div class="rapid-footer-bottom"><p class="fine">Antenas Rapid · Propiedad de R.F.G.</p>${legalLinks}<a class="footer-back-top" href="#">Volver arriba <span aria-hidden="true">↑</span></a></div></div></footer>`;
}
