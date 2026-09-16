# Antenas Rapid · decisión vigente de SEO local

Fecha: 2026-09-16.

Esta decisión sustituye la cautela inicial del inventario sobre no generar localidades en masa.

## Decisión vigente

Antenas Rapid utilizará un generador automático de páginas HTML locales, siguiendo la arquitectura técnica probada en Antenista Cerca pero manteniendo identidad, textos, rutas y contenido propios de Antenas Rapid.

- Una página HTML real por localidad cubierta.
- Objetivo de escala: aproximadamente 2.000 localidades, ampliable sin crear archivos manualmente.
- Las páginas históricas verificadas conservan su ruta cuando exista una equivalente.
- Cada localidad debe tener title, H1, meta description y canonical propios.
- La intención principal será antenista/técnico de antenas + localidad + teléfono, acompañada de reparación de antenas, TDT, antenas colectivas e individuales, parabólicas, amplificación, porteros automáticos, videoporteros y cobertura móvil residencial.
- El generador introduce variación determinista en introducciones, orden de bloques, textos técnicos, FAQs y enlaces internos. No se limita a sustituir el nombre del pueblo en una plantilla idéntica.
- No se inventan oficinas, reseñas, tiempos de llegada, trabajos realizados ni direcciones locales.
- Durante la revisión todas las páginas permanecen noindex,nofollow.

## Implementación

`scripts/generate-town-pages.mjs` genera las páginas desde las localidades cargadas en las provincias, conserva las páginas especiales existentes y enlaza cada localidad desde su página provincial.

`scripts/audit-town-pages.mjs` verifica que cada localidad tenga HTML, canonical, título y descripción únicos, teléfono, intenciones de servicio local e interlinking provincial.

El número de HTML generados depende únicamente del conjunto de localidades cargado; ampliar a unas 2.000 localidades no requiere escribir ni mantener 2.000 archivos a mano.
