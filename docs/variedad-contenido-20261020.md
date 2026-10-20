# Variedad de contenido municipal — 20/10/2026

Comparación del paquete anterior (48e47ee) con el paquete final de esta revisión.

| Métrica de la muestra fija | Antes | Después |
| --- | ---: | ---: |
| Similitud mediana | 64,82 % | 35,22 % |
| Percentil 90 | 74,82 % | 44,05 % |
| Media | 63,17 % | 35,79 % |

Método: Jaccard de conjuntos de grupos de cinco palabras del texto principal. Se excluyen scripts, estilos y texto de enlaces y se normalizan el municipio y la provincia. Muestra aleatoria reproducible de 80 municipios (semilla 20261020), 3.160 comparaciones por pares. La reducción mediana es de 29,60 puntos porcentuales. No es una métrica de Google ni una garantía de posicionamiento. El nombre del pueblo o el orden de bloques no cuentan por sí solos como diferenciación editorial.

Reproducción: `python scripts/measure-text-similarity.py dist` después de `npm run build:production`. Para comparar versiones, generar y medir cada checkout por separado con el mismo script.

Se conservan nueve servicios básicos con 27 explicaciones de diagnóstico; siete módulos se seleccionan de veinte para cada municipio; se varían el caso práctico y cuatro preguntas. Las asignaciones son pseudoaleatorias y estables a partir de la ruta del municipio. Los 3.797 municipios producen 3.629 selecciones diferentes de siete servicios y 3.797 bloques técnicos diferentes al normalizar el nombre de la localidad. Hay dieciséis casos prácticos. El contenido se plantea como síntomas y opciones de diagnóstico, sin atribuir averías, condiciones geográficas ni trabajos realizados a localidades concretas.

Incluye antenas, modulación, reemisores, electricidad doméstica, cerraduras eléctricas, mirillas Wi-Fi, TV LED, sintonía, Wi-Fi interior, cobertura móvil y soluciones de televisión o Internet por satélite. La portada presenta las veinte soluciones.

Validación: 76 pruebas unitarias; build de producción; 3.839 URLs indexables; auditorías de enlaces, contactos regionales, canonicals, sitemaps y distritos Madrid correctas.
