import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(root)) {
  if (!file.endsWith('.html')) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  // Ningún texto interno de desarrollo debe quedar visible para el cliente.
  html = html
    .replace(/<div class="preview"><b>VISTA PREVIA<\/b>[^<]*<\/div>/g, '')
    .replaceAll('Los nombres enlazados ya disponen de una página de prueba.', 'Selecciona tu municipio para consultar los servicios disponibles.')
    .replaceAll('Buscar en esta selección', 'Buscar municipio')
    .replaceAll(' localidades en esta selección', ' municipios disponibles')
    .replace(/<p class="notice">Vista previa: selección parcial del listado de la web actual\. No se ha terminado el inventario de municipios ni la revisión de todas sus páginas\.<\/p>/g, '')
    .replace(/<details><summary>Información de esta vista previa y privacidad<\/summary><p>[\s\S]*?<\/p><\/details>/g, '')
    .replaceAll('Antenas Rapid · Versión de revisión. La web actual permanece en su alojamiento. Fotografías y listado completo de localidades pendientes de revisión.', 'Antenas Rapid · Propiedad de R.F.G. · 641 589 394')
    .replaceAll('Página no incluida en esta vista previa', 'Página no disponible')
    .replaceAll('El inventario de la renovación está en revisión. Esto no indica que la página se haya eliminado de la web actual.', 'La dirección solicitada no está disponible. Puedes volver al inicio o contactar con Antenas Rapid.');

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed++;
  }
}

console.log(`COPY FINAL OK: ${changed} HTML limpiados; sin textos de demo, revisión, página de prueba ni inventario pendiente visibles.`);
