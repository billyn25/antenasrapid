# Revisión de Asturias y Soria — 5 de octubre de 2026

Base revisada: main, commit 7782ffdbbf04ed3c7df282b4a364ea3f050d4c03.

Soria ya estaba completa: 183 municipios, directorio /Antenas-Soria/ y sitemap-soria.xml con 184 URLs. No se duplica ni se regeneran rutas diferentes.

Asturias faltaba en la selección municipal y en los directorios. Se incorpora el identificador provincial 33 con los 78 municipios/concejos del mismo dataset fijado que utiliza el proyecto. Se añade /Antenas-Asturias/, una página por municipio y sitemap-asturias.xml con 79 URLs, incluido en el índice principal. La portada muestra ocho destacados y doce adicionales en el desplegable, con enlace al directorio completo.

Total: 3305 municipios en 17 provincias. Se conservan teléfono 641 589 394, dominio, servicios (incluido TDT por satélite HD) y códigos postales de Madrid. No se añaden códigos postales no contrastados para Asturias o Soria. El hero fotográfico y la galería siguen limitados a la portada y Madrid; no se extienden a otras provincias.

Validación local: 54 pruebas unitarias y build de producción completo, usando copias del dataset fijado y de las imágenes del build de referencia. Comparación de las 3227 páginas municipales anteriores: head y contenido principal idénticos; solo se amplía la navegación provincial. Sitemaps anteriores, recursos, robots y cabeceras idénticos. Directorios de Madrid y Soria: head y contenido principal conservados.

Renderizado local del HTML/CSS/JS generado en Chromium a 320, 390 y 1440 píxeles: 15 escenarios sobre Asturias, Llanes, Soria, Almazán y Coslada; búsqueda, preguntas desplegables, conservación del hero y galería de Madrid, sin desbordamientos horizontales. Esta comprobación no certifica el despliegue público de Netlify.
