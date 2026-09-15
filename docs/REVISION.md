# Revisión 0.1 — 15 de septiembre de 2026

## Alcance real

8 páginas iniciales más 404. No es una migración completa. Los listados provinciales son selecciones; no se han importado los 2.878 municipios de Antenista Cerca. Los enlaces locales solo se crean para Bilbao y Lerma en esta fase. El resto son menciones de cobertura del sitio de origen, no URLs locales inventadas.

## Fuentes públicas consultadas

- https://www.antenasrapid.com/ (copia recuperada: hace 2 meses).
- https://www.antenasrapid.com/Antenas-Alava/ (hace 3 meses).
- https://www.antenasrapid.com/Antenas-Bizkaia/ (hace 11 meses).
- https://www.antenasrapid.com/Antenas-Burgos/ (mes anterior; numerosos enlaces locales).
- https://www.antenasrapid.com/Antenas-Cantabria/ (hace 8 meses).
- https://www.antenasrapid.com/Antenas-Guipuzcoa/ (hace 3 meses).
- https://www.antenasrapid.com/Antenas-Burgos/lerma.html (hace 7 meses).
- /Antenas-Bizkaia/bilbao.html: enlace en la provincia; recuperación del contenido no completada.

No se confirmó HTTP actual, redirección ni canonical de la web antigua. La conexión directa desde el entorno de trabajo no resolvió el dominio. Eso no prueba caída del sitio. No se consultó Search Console ni se validaron posiciones. El usuario señala que Rapid ya posiciona y se trata como una web en servicio que debe preservarse.

Servicios base observados: TDT, parabólicas, amplificación, porteros/videoporteros, tomas y cableado y mantenimiento. La redacción nueva es una propuesta editorial para revisión, no una transcripción de esos sitios. No se copiaron descripciones de Antenista Cerca, Epa Antena o Antenas Urge. No se trasladaron cifras de reparaciones, minutos de llegada o supuestas oficinas.

## Fotografías e identidad

La recuperación de fotos de Antenas Rapid no se completó. Se usa una ilustración técnica de interfaz, identificada como tal, y una marca tipográfica provisional. No se reutiliza el técnico/furgoneta ni el logotipo de Antenista Cerca. Falta revisión visual del titular.

## Pruebas y publicación

`npm run build` valida rutas, noindex, H1 único, títulos únicos, JSON-LD, contactos, anclas y enlaces internos de la salida. El alcance es el contenido generado, no el posicionamiento ni todas las URLs históricas. Las pruebas de navegador y su resultado se documentan en QA.md cuando se ejecutan. El build no hace peticiones a servicios externos.

Sin analítica, cookies, localStorage ni formularios en esta vista previa. Se evita heredar cualquier ID del proyecto anterior. No se afirma cumplimiento legal completo por no tener seguimiento.

## Referencias técnicas

- Netlify: https://docs.netlify.com/start/quickstarts/deploy-from-repository/
- Configuración: https://docs.netlify.com/build/configure-builds/overview/
- Google noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing

Se permite el rastreo para que el buscador lea noindex. No se incluye sitemap parcial ni redirección comodín de rutas desconocidas a la portada. Noindex no es autenticación.
