# Antenas Rapid · renovación 0.3

Versión independiente de revisión. No conectar el dominio actual ni sustituir la web que ya posiciona.

## Objetivo: pueblos, servicios y teléfono

La prioridad comercial son los pueblos, no las capitales. La portada usa «Antenistas en tu pueblo»; las provincias permiten encontrar cada localidad. Las URLs antiguas se conservan, incluidas las de ciudades, sin convertirlas en el foco del proyecto.

Una página local identifica pueblo y provincia: «Antenista en Lerma, Burgos | 641 589 394». El teléfono aparece al principio de la descripción. Se mantiene íntegra la frase aprobada «Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros» en contenido visible y metadatos, junto con antenas colectivas e individuales. Porteros automáticos y videoporteros tienen menú, sección y fichas propias.

La portada ya no se limita a Bizkaia; su página provincial y sus enlaces permanecen. Se ha ajustado el icono de la marca a una antena sobre tejado, sin cambiar la línea grafito, blanco y rojo ni generar fotografías.

## Netlify: solo revisión

Repositorio `billyn25/antenasrapid`, rama `main`. Directorio base vacío, comando `npm run build`, publicación `dist`. Node 22 y `SITE_MODE=preview` configurados en `netlify.toml`. Mantener la dirección temporal `.netlify.app`, sin cambiar DNS.

Se conserva `noindex,nofollow` en HTML y cabeceras, sin analítica. No equivale a una web privada. El build rechaza el dominio actual y el modo de producción; no genera un sitemap incompleto.

## Alcance real

Ocho páginas de revisión: portada, cinco provincias, Bilbao y Lerma. Las direcciones existentes y sus terminaciones `.html` no cambian. Los demás municipios del índice no son todavía páginas terminadas. Inventario completo, fotografías autorizadas, más contenidos locales útiles e información legal completa siguen pendientes. No se importan localidades ni textos de Antenista Cerca.

## Pruebas y documentación

`npm run build` ejecuta los tests, genera HTML y audita enlaces. `npm run preview` sirve la salida en el puerto 4173. Esta entrega pasa 24 tests automáticos y la auditoría de 175 enlaces/anclas; 32 comprobaciones locales de diseño en Chromium. Alcance y limitaciones en `docs/SEO-LOCAL-03.md`.

## Antes de producción

Completar mapa de URLs y consultas de Search Console, revisar cobertura y contenido, recuperar fotografías, completar datos del titular y preparar respaldo y redirecciones cuando sean necesarias. La sustitución del dominio real requiere revisión y autorización expresa. No se garantizan posiciones ni que Google muestre íntegro el teléfono o la descripción.
