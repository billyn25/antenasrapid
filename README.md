# Antenas Rapid · renovación 0.2

Versión independiente de revisión. No conectar el dominio actual ni sustituir todavía la web que ya posiciona.

## Cambios 0.2

Identidad visual propia: grafito, blanco y rojo; cabecera, bloque de contacto y servicios rediseñados. Sin la ilustración provisional de la versión anterior ni recursos de Antenista Cerca.

La frase «Técnico en instalación, reparación y mantenimiento de antenas, porteros automáticos y videoporteros» aparece íntegra en el contenido visible, meta description, Open Graph y descripción de WebPage. Las páginas locales comienzan con «Antenista en [localidad]» en H1 y título; el teléfono forma parte del título y aparece al principio de la descripción. Google puede elegir otro título o fragmento.

Porteros automáticos y videoporteros tienen acceso directo en el menú, sección principal de instalación/reparación/mantenimiento, fichas separadas y preguntas específicas. No se inventan sedes, reseñas, obras ni tiempos de llegada.

## Netlify (solo revisión)

- Repositorio: `billyn25/antenasrapid`, rama `main`.
- Directorio base vacío; comando `npm run build`; publicación `dist`.
- Node 22 y `SITE_MODE=preview` configurados en `netlify.toml`.
- Mantener la dirección temporal `.netlify.app`, sin cambiar DNS.

Se conserva el bloqueo `noindex,nofollow` en HTML y cabeceras, sin analítica. No es una página privada. El build rechaza el dominio actual y el modo de producción. No se genera un sitemap incompleto.

## Alcance real

Ocho páginas: portada, cinco provincias y dos locales (Bilbao y Lerma), conservando las rutas y `.html`. Los demás municipios del índice siguen siendo una selección parcial, no páginas ya construidas. Fotografías propias, inventario completo, más páginas locales útiles e información legal completa siguen pendientes. El inventario original está en `docs/INVENTARIO-INICIAL.md`.

## Pruebas

`npm run build` ejecuta las pruebas y la auditoría del HTML. `npm run preview` abre el servidor local en el puerto 4173.

Resultado local de esta entrega: 17 pruebas automáticas, 175 enlaces y anclas; 32 comprobaciones de los componentes renderizados (ocho páginas en 320, 390, 768 y 1440 px), tres pruebas de filtrado del índice, sin errores de JavaScript. Para las pruebas visuales se inyectaron los CSS y JS locales en Chromium; no constituyen una prueba de la publicación HTTP de Netlify.

## Antes de producción

Completar el mapa de URLs actuales y consultas de Search Console, verificar cobertura y contenido, recuperar fotografías autorizadas, completar información del titular, preparar respaldo y redirecciones solo cuando hagan falta. Publicar en el dominio real únicamente tras revisar la migración y recibir autorización.
