# Corrección de canónicas y diagnóstico de indexación — 7 de octubre de 2026

## Diagnóstico HTTP real

Fuentes: Rapid main af05db2a31fdaa8520f6d97c476b306a11738d13 y Cerca refactor-limpieza-segura 1d97ad59f665727aef8fb40df351ea2e892b883d. Lecturas GET desde Actions 37593129966; artifact 11468689427 contiene cadenas, respuestas, HTML, XML y fuentes exactas.

Rapid: /Antenas-Madrid/corpa.html devuelve 301 a /antenas-madrid/corpa, cuyo HTTP 200 seguía declarando como canonical la URL que redirige. /Antenas-Cantabria/ devuelve 301 a /antenas-cantabria/. Se mantienen la barra final provincial y la ausencia de barra final municipal, conforme a las respuestas reales. De 68 solicitudes de Rapid, 66 completaron con HTTP 200 después de los saltos necesarios y 2 agotaron el tiempo (la variante histórica de Torrejón de la Calzada y Paredes de Nava). No se interpreta un timeout aislado como caída permanente. Los 18 sitemaps hijos publicados se leyeron correctamente: 3324 URLs con el formato antiguo, 17 provincias más core.

## Solución

La fase final de producción normaliza canónicas, enlaces internos, og:url y URLs de datos estructurados antes de crear los sitemaps. El dominio sigue siendo HTTPS con www. Se conservan los 3328 archivos HTML físicos y el contenido; no se migran pueblos, no se eliminan imágenes, no se añaden redirecciones globales a portada ni reglas para forzar barras finales. El alojamiento ya ofrece las URLs públicas correctas y redirige sus variantes antiguas.

Se distingue la ruta física de cada archivo de su URL pública. El servidor de previsualización resuelve ambas. La auditoría nueva verifica correspondencia canonical/HTML, enlaces, anclas, schema, unicidad y coincidencia exacta del sitemap con el conjunto indexable.

## Validación

Actions 37595023333, intento 2, fuente verificada 39e4b4038a3996dbe1a0b7a8470de73a9336736f: 60 pruebas unitarias, build completo, todas las auditorías, 3324 URLs indexables y 150719 enlaces/anclas. La segunda preparación de producción no modifica ningún HTML y el paquete repetido es idéntico. Doce escenarios de navegador a 390 y 1440 píxeles comprueban portada, Cantabria, Madrid, Corpa, Alcobendas y Lerma, además de la búsqueda postal 28801 y navegación a Alcalá de Henares. Artifact 11469758576 conserva logs, informe del navegador y fuentes.

La comparación local con el build de referencia confirma idénticos títulos, H1, descripciones, directivas robots, texto visible, fotografías y destinos de teléfono/WhatsApp en los 3328 HTML. Los 24 archivos no HTML fuera de los sitemaps permanecen idénticos. Siguen los 3305 municipios, 17 provincias, Madrid con galería y códigos postales y todos los servicios anteriores.

El primer intento de la validación se interrumpió al descargar una fotografía ya existente desde Antenas Zalla; su repetición completó todas las etapas sin modificar ni omitir las pruebas.

## Conciliación del cambio concurrente en main

Durante la revisión entraron tres commits que modificaron solo build.mjs y prepare-production-assets.mjs. La ejecución 37595690063 del commit 13c62cf falló siete pruebas al normalizar prematuramente los datos del generador; también cambió el título de Lerma y las rutas físicas. Se sustituye ese enfoque por la normalización final ya comprobada. La integración tiene como padre el main actual, conserva su historial y no incluye el workflow temporal. No se rebajan las comprobaciones de conservación de rutas o contenido.

## Antenista Cerca

http://antenistacerca.es/ y https://www.antenistacerca.es/ devuelven 301 a https://antenistacerca.es/. La portada final devuelve 200 y se declara canónica a sí misma. Se comprobaron 20 URLs HTML canónicas distintas, incluyendo portada, Coslada, Lerma, Galdakao y una localidad de cada provincia: todas respondieron 200 directamente, index/follow y canonical autorreferente, sin noindex en meta o cabeceras. Robots permite rastreo.

Los 17 sitemaps hijos de Cerca respondieron correctamente con 3074 URLs: 3057 municipios, 16 directorios y portada. Madrid está publicado y tiene 180 URLs en su sitemap.

Las dos redirecciones de portada son intencionadas y no deben quitarse para que la validación muestre cero. Este informe no explica la exclusión de otras páginas municipales. Para diagnosticarla hacen falta los restantes motivos de exclusión e inspecciones de URL de Google Search Console. No se ha modificado el código ni la rama refactor-limpieza-segura de Cerca durante esta revisión. Elegibilidad técnica no equivale a indexación confirmada en Google, ni estas pruebas garantizan posiciones.

## Referencias

Google Search Console: https://support.google.com/webmasters/answer/7440203
Google Search Central, canónicas: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
Netlify, normalización de rutas: https://docs.netlify.com/manage/routing/redirects/redirect-options/
