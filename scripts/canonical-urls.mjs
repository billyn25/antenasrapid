/** Match verified Netlify public URLs without moving or deleting HTML files. */
import fs from 'node:fs';
import path from 'node:path';
export const PRODUCTION_DOMAIN = 'https://www.antenasrapid.com';
export function canonicalPath(value) {
  if (typeof value !== 'string' || !/^\/antenas-[^/?#]+(?:\/|$)/i.test(value)) return value;
  const cut = value.search(/[?#]/);
  let pathname = cut < 0 ? value : value.slice(0, cut);
  const suffix = cut < 0 ? '' : value.slice(cut);
  if (/\.[^/]+\/?$/.test(pathname) && !/\.html\/?$/i.test(pathname)) return value;
  pathname = pathname.toLowerCase().replace(/\/index\.html$/i, '/').replace(/\.html\/?$/i, '');
  const parts = pathname.split('/').filter(Boolean);
  pathname = '/' + parts.join('/') + (parts.length === 1 ? '/' : '');
  return pathname + suffix;
}
export function canonicalUrl(value) {
  if (typeof value !== 'string' || value.startsWith('//')) return value;
  const absolute = value.match(/^(https?:\/\/[^/?#]+)(\/[^?#]*)([?#].*)?$/i);
  if (absolute) {
    if (!/^https?:\/\/(?:www\.)?antenasrapid\.com$/i.test(absolute[1])) return value;
    return PRODUCTION_DOMAIN + canonicalPath(absolute[2]) + (absolute[3] || '');
  }
  return canonicalPath(value);
}
export function rewriteCanonicalHtml(html) {
  let result = html.replace(/\b(href|content|action|data-route)=(['"])(.*?)\2/g,
    (all, attr, quote, value) => `${attr}=${quote}${canonicalUrl(value)}${quote}`);
  result = result.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (all, open, raw, close) => {
      const rewrite = value => {
        if (typeof value === 'string') return canonicalUrl(value);
        if (Array.isArray(value)) return value.map(rewrite);
        if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,rewrite(v)]));
        return value;
      };
      return open + JSON.stringify(rewrite(JSON.parse(raw))).replace(/</g, '\\u003c') + close;
    });
  return result;
}
export function htmlFiles(root) {
  return fs.readdirSync(root, {withFileTypes:true}).flatMap(entry => {
    const full = path.join(root, entry.name);
    return entry.isDirectory() ? htmlFiles(full) : entry.isFile() && full.endsWith('.html') ? [full] : [];
  });
}
export function publicRouteMap(root) {
  const result = new Map();
  for (const file of htmlFiles(root)) {
    const rel = path.relative(root,file).split(path.sep).join('/');
    const route = canonicalPath('/' + rel.replace(/(?:^|\/)index\.html$/, match => match.startsWith('/') ? '/' : ''));
    if (result.has(route)) throw new Error(`Colisión de rutas canónicas: ${route}`);
    result.set(route, file);
  }
  return result;
}
export function normalizeCanonicalHtml(root) {
  publicRouteMap(root);
  let count=0;
  for (const file of htmlFiles(root)) {
    const html=fs.readFileSync(file,'utf8'), rewritten=rewriteCanonicalHtml(html);
    if (html!==rewritten) { fs.writeFileSync(file,rewritten);count++; }
  }
  console.log(`CANÓNICAS HTTP: ${count} HTML actualizados; ficheros, contenido y redirecciones existentes conservados.`);
}
