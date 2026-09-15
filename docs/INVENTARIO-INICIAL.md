# Antenas Rapid

Renovación independiente de la web de servicios de Antenas Rapid. Este repositorio no sustituye ni modifica por sí mismo la web publicada.

## Estado del proyecto

- Inicio: 15 de septiembre de 2026.
- Repositorio independiente: `billyn25/antenasrapid`.
- Sitio de referencia: https://www.antenasrapid.com/
- Fase actual: inventario preliminar y definición de la base; todavía no contiene la nueva web ni un build publicable.
- No se ha configurado alojamiento, despliegue automático, dominio ni DNS desde este repositorio.
- Antenista Cerca queda fuera del alcance de los cambios de este proyecto.

## Decisiones de partida

1. Renovar Antenas Rapid conservando las direcciones existentes siempre que sea posible, incluidas mayúsculas, carpetas y terminaciones `.html`.
2. No importar automáticamente las 2.878 localidades, textos, fotografías o logotipo de Antenista Cerca. Se pueden reutilizar componentes técnicos revisados, no clonar el contenido comercial.
3. Mantener una configuración propia y centralizada para marca, dominio, teléfono, cobertura, imágenes, analítica y datos del responsable. No trasladar identificadores de medición del otro proyecto.
4. No inventar oficinas locales, trabajos realizados, reseñas, cifras, tiempos de llegada ni disponibilidad. Las afirmaciones existentes requieren confirmación antes de trasladarlas.
5. No cambiar alojamiento ni dominio de la web actual mientras se prepara esta renovación.
6. Trabajar y probar localmente; agrupar cambios antes de cada publicación. Netlify no es necesario para esta fase.
7. Una página por localidad cuando exista cobertura y utilidad justificadas. Antes de añadirla, comprobar si ya hay una URL equivalente.
8. Mantener separados resultados de auditoría técnica, comprobaciones de indexación y datos de posicionamiento. No garantizar ausencia de penalizaciones ni conservación de posiciones.

## Inventario inicial de la web existente

**Alcance: parcial, no es todavía un inventario de migración aprobado.**

Se consultaron el 15 de septiembre de 2026 las fuentes públicas enlazadas en esta tabla. El buscador devolvió copias rastreadas en fechas anteriores; la antigüedad comunicada se conserva como limitación. Se intentó obtener los recursos directamente desde el entorno de trabajo, pero no se pudo resolver el dominio desde ese entorno. Esto no demuestra que la web esté caída.

Por tanto, «contenido recuperado» no equivale a confirmar hoy un HTTP 200, la URL final, una redirección, el canonical o la indexación en Google. No se ha accedido a Search Console ni a datos de tráfico.

| Tipo | URL de referencia | Evidencia disponible | Pendiente |
| --- | --- | --- | --- |
| Portada | https://www.antenasrapid.com/ | Contenido recuperado; copia indicada como rastreada hace 2 meses. Enlaza cinco provincias. | Estado HTTP y metadatos actuales; consultas y tráfico. |
| Provincia | https://www.antenasrapid.com/Antenas-Alava/ | Contenido provincial y listado de municipios recuperados; copia de hace 3 meses. | Verificar cuáles de los nombres tienen página propia. |
| Provincia | https://www.antenasrapid.com/Antenas-Bizkaia/ | Contenido recuperado; copia de hace 11 meses. Incluye un enlace local a Bilbao. | Recorrido completo y vigencia del enlazado local. |
| Provincia | https://www.antenasrapid.com/Antenas-Burgos/ | Contenido y numerosos enlaces municipales recuperados; copia del mes anterior. | Extraer y verificar todas las rutas de esos enlaces. |
| Provincia | https://www.antenasrapid.com/Antenas-Cantabria/ | Contenido recuperado; copia de hace 8 meses. | Recorrido del listado y verificación de rutas locales. |
| Provincia | https://www.antenasrapid.com/Antenas-Guipuzcoa/ | Contenido recuperado; copia de hace 3 meses. | Recorrido del listado y verificación de rutas locales. |
| Localidad | https://www.antenasrapid.com/Antenas-Burgos/lerma.html | Contenido y título referidos a Lerma, Burgos; copia de hace 7 meses. | Estado actual, canonical y consultas que atrae. |
| Localidad | https://www.antenasrapid.com/Antenas-Bizkaia/bilbao.html | Ruta referenciada por la página provincial; no se recuperó su contenido en esta consulta. | Verificación completa; no clasificar como eliminada sin comprobarla. |

Las cinco provincias anteriores son las observadas en la navegación, no una certificación independiente de cobertura comercial.

También están pendientes de recuperación `robots.txt` y `sitemap.xml`. Los errores de la herramienta de consulta no permiten afirmar que esos archivos no existan.

### Diferencias observadas que guían la revisión

- La portada recuperada tiene orientación a Bizkaia; no se presupone que su posición para consultas locales sea incorrecta.
- El listado recuperado de Burgos muestra muchos enlaces a localidades; no se debe rehacer el sitio como si solo existieran páginas provinciales.
- En la copia de Bizkaia, Bilbao aparece enlazada mientras muchos otros municipios se presentan como texto. Hay que diferenciar una zona mencionada de una página local existente.
- Las copias provinciales incluyen cifras de trabajos y tiempos de llegada: conservarlos únicamente si el titular confirma que son ciertos y aplicables.
- El teléfono visible en las fuentes consultadas es `641 589 394`. Se documenta como dato observado, no como prueba de identidad legal.

## Base técnica prevista

Propuesta de organización para la implementación, aún no creada:

```text
config/site.json          # Marca, dominio, contacto y configuración propios
content/                  # Contenido de Antenas Rapid, separado de las plantillas
data/legacy-urls.json      # Inventario verificado y decisiones por URL
src/                      # Plantillas y componentes reutilizables
src/assets/               # Recursos autorizados y propios de esta web
scripts/                  # Generación y validaciones
 tests/                   # Pruebas de HTML, navegación, contacto y consentimiento
```

El directorio de pruebas se llamará `tests/`, sin espacio inicial; la estructura anterior es orientativa y no constituye archivos ya implementados.

La fase de desarrollo no debe cargar analítica de producción. Una futura vista previa pública necesitará un bloqueo explícito de indexación; `robots.txt` por sí solo no se considerará suficiente. Aún no se ha creado ninguna vista previa.

## Siguiente entrega

1. Completar el inventario de enlaces reales y las variantes de URL. Registrar por cada dirección: fuente, respuesta, URL final, título, H1, canonical, robots y destino propuesto. Cuando algo no pueda comprobarse, dejarlo como pendiente.
2. Definir la configuración central y el generador sin encadenar scripts que sobrescriban la misma página.
3. Implementar portada y una página provincial de referencia con contenido de Antenas Rapid, manteniendo las rutas existentes.
4. Revisar la necesidad y el contenido propio de cada página local; no generar localidades en masa a partir de simples menciones.

## Condiciones antes de sustituir la web actual

- Inventario completado y mapa de rutas revisado; ninguna URL conocida desaparece sin decisión explícita.
- Redirecciones permanentes solo cuando sean necesarias y hacia la página equivalente, nunca todas a la portada.
- Contenido y cobertura confirmados; ningún dato del otro proyecto trasladado por accidente.
- Diseño y navegación comprobados en móvil y escritorio, sin alterar la web que sigue publicada.
- Enlaces de llamada y WhatsApp funcionales; analítica propia bloqueada hasta consentimiento cuando se incorpore.
- Sitemap, canonicals, respuestas HTTP y ausencia de enlaces rotos revisados sobre la salida definitiva.
- Copia recuperable del sitio anterior y plan de reversión comprobado.
- Autorización expresa para conectar dominio y sustituir producción.

Los textos y rutas de esta primera revisión proceden de las fuentes públicas citadas en la tabla. Las decisiones de implementación son propuestas del proyecto, no afirmaciones de Google ni garantías de posicionamiento.
