# Comprobaciones de la entrega 0.1

Fecha: 15 de septiembre de 2026. Esta hoja distingue pruebas locales de publicación real.

## Ejecutado en esta entrega

- `npm run build` con Node 22.16.0: 11 tests aprobados, 0 fallidos.
- Auditoría de salida: 8 páginas y 151 enlaces internos/anclas comprobados.
- Revisados: H1 y títulos, rutas con mayúsculas y `.html`, JSON-LD, contactos, noindex y ausencia del ID de Analytics de Antenista Cerca.
- Servidor local: portada y Lerma responden 200; ruta desconocida responde 404; cabecera `X-Robots-Tag: noindex, nofollow` presente.
- Chromium: 24 vistas de componentes (8 páginas en 320, 390 y 1440 píxeles). Sin desbordamiento horizontal ni solapamiento de marca y teléfono. Búsqueda, ausencia de coincidencias y restablecimiento mediante abecedario comprobados; sin errores JavaScript.

## Método y límites

La navegación HTTP de Chromium fue bloqueada por la configuración del entorno. Las pruebas visuales y de interacción utilizaron el HTML generado con CSS y JavaScript locales inyectados mediante Playwright; las respuestas HTTP del servidor local se comprobaron por separado. No equivalen a una prueba publicada de Netlify ni a dispositivos físicos.

No se han pulsado enlaces para efectuar llamadas ni enviado mensajes. Se comprueban los destinos de los enlaces. No se ha medido posicionamiento, tráfico, indexación real ni Core Web Vitals de campo. No se certifica que el sitio completo esté listo para migrar.

## Pendiente tras importar en Netlify

Confirmar construcción correcta; abrir portada, provincia y página `.html`; comprobar cabeceras HTTP y 404 en ese alojamiento; revisar en móvil real. Mantener el dominio de producción donde está.
