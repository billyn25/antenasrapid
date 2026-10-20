# Contexto municipal y enlaces reales — 20/10/2026

Problema: los municipios enlazados se elegían por rotación de la lista provincial y no por cercanía. Los directorios provinciales distintos de Madrid conservaban el hero sin fotografía.

## Resultado

- Foto de portada aplicada a los 19 directorios provinciales, incluida Zamora; metadatos e identidad visual conservados.
- 3.797 fichas con población de referencia, superficie municipal en km², núcleo de referencia y enlace al mapa del IGN.
- Seis destinos por municipio, ordenados por distancia geodésica entre coordenadas de referencia: 22.782 enlaces. Solo se seleccionan municipios que ya tienen página en el sitio. Se explicita que no son distancias por carretera ni tiempos de atención.
- Continuidad provincial mediante los municipios anterior y siguiente en el orden de código INE. Cada municipio recibe enlaces desde al menos otros dos municipios; estos enlaces no se presentan como los más cercanos.
- Se elimina la segunda lista de municipios elegidos sin criterio geográfico. Los destinos usan las URLs finales mediante la normalización existente.
- Se compactan las explicaciones corporativas repetidas conservando marcas y contactos. Los porteros mantienen su sección, CTA y tres casos técnicos, elegidos de doce diagnósticos útiles; no se atribuyen averías ni trabajos realizados a un municipio.

## Fuente y fechas

IGN: https://www.ign.es/web/ign/portal/ane-datos-geograficos

Archivo original: https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS.xlsx

Tabla revisada el 20/10/2025, licencia CC BY 4.0 ign.es, 2025. La tabla no especifica el año de referencia del padrón; por eso no se presentan las cifras como población actual, ni se inventan variaciones anuales. Las coordenadas son referencias cartográficas aproximadas. No se deduce calidad de recepción, orografía ni cobertura del tamaño o población del municipio.

El snapshot offline contiene los campos identificados y el hash del XLSX. Para actualizarlo: descargar el archivo oficial y ejecutar `python scripts/import-municipal-context.py /ruta/IGN_INFOGEO_MUNICIPIOS.xlsx`. Revisar los cambios, fechas, licencia y cobertura de IDs antes de construir.

## Medición y validación

Misma muestra fija de 80 municipios, 3.160 pares; Jaccard de grupos de cinco palabras del texto principal, sin enlaces, scripts ni estilos; municipio y provincia normalizados. Comparación con 481e8a9.

| Métrica | Antes | Después |
| --- | ---: | ---: |
| Mediana | 35.22 % | 31.75 % |
| Percentil 90 | 44.05 % | 40.61 % |
| Media | 35.79 % | 32.41 % |

Es una comparación editorial propia, no una métrica de Google ni una garantía de indexación.

82 pruebas superadas. Auditorías de producción, contactos regionales, 3.839 canónicas, sitemaps, distritos Madrid y navegación geográfica correctas. Auditoría completa de distancia, pertenencia al sitio, ausencia de autorreferencias y mínimos de enlaces entrantes para 3.797 fichas. Verificados los 19 heroes provinciales y sus recursos existentes.
