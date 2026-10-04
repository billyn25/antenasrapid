# Hero y galería: solo Madrid

El directorio /Antenas-Madrid/ y sus 179 páginas municipales reutilizan la misma fotografía de fondo, estilo responsive y galería de 12 imágenes de la portada. La galería mantiene su ampliación en modal y carga diferida. No se presenta como prueba de trabajos realizados específicamente en Madrid.

Se reutilizan los recursos locales ya generados: no se duplican imágenes, no se incorporan fuentes remotas nuevas y no cambian las fotografías ni estilos de la portada. Los textos locales del hero, H1, metadatos, teléfonos, servicios, códigos postales, buscador, enlaces y sitemaps se conservan.

La nueva fase madrid-visuals se ejecuta después de madrid-postal y antes de las auditorías habituales. Su alcance se limita a la ruta provincial y sus páginas HTML municipales. Las demás provincias y la portada no se reescriben.

Validación local: 51 pruebas unitarias y build de producción usando copias de los mismos datos e imágenes de la construcción de referencia. Comparación de 3249 HTML: únicamente cambian los 180 de Madrid. Los 3069 restantes, recursos, robots y XML son idénticos. En Madrid, al retirar solo la galería añadida y las clases del hero, cada HTML coincide exactamente con la referencia.

La prueba tests/madrid-visuals.browser.py comprueba directorio, Alcalá de Henares y un nombre municipal largo, Chromium a 320/390/768/1440 y WebKit a 390, misma foto que la portada, 12 imágenes, apertura/cierre del modal, ausencia de desbordamiento, búsqueda postal y aislamiento de Burgos.
