# Referencias residenciales de Madrid

Revisión de 24/10/2026. Sustituye la selección global de avenidas por zonas con calles documentadas. No modifica títulos, URLs, formularios ni códigos postales.

## Fuentes

- [Nomenclátor plurianual de la Comunidad de Madrid](https://gestiona.comunidad.madrid/nomenclator/Indice.icm), versión 03/12/2025. Tramero por municipio con entidad, núcleo, sector, vía y rango de numeración. Se comprobaron todas las páginas de sectores, no solo las primeras cincuenta filas.
- [IDEM](https://www.comunidad.madrid/geoportal/idem): callejero regional en ETRS89/UTM 30N y planeamiento de usos predominantes. Capas `VPLA_V_ORDENANZA_REF_25` y, para los doce municipios sin representación en esa capa, `VPLA_V_ORDENANZA`.
- [Barrios oficiales de Madrid](https://geoportal.madrid.es/IDEAM_WBGEOPORTAL/dataset.iam?id=422fa235-762b-11e9-861d-ecb1d753f6e8) y polígonos de núcleos de población de IDEM. Se emplean para Madrid capital y Torrelaguna, cuyos XLS completos no pudieron obtenerse del Nomenclátor. No se inventan asignaciones de sector para estos dos municipios.
- Fuentes municipales específicas en los grupos de Coslada, San Fernando, Getafe y El Cantizal (Las Rozas). Sus URLs están incluidas en el snapshot y se publican dentro del desplegable de fuentes.

## Método

1. Se cruzan las geometrías de las vías con el planeamiento residencial e industrial del mismo municipio. Distancia de borde: 18 m, para tener en cuenta la calzada entre las parcelas.
2. Se conserva una vía si al menos el 55% de su trazado está próximo a uso predominantemente residencial y como máximo el 8% a industrial. Es un filtro de selección, no una prueba de ocupación real de todas sus parcelas. Se omiten ámbitos aplazados; una clasificación urbanizable no implica por sí sola que la calle esté vacía o construida.
3. Se asigna a una zona solo si el tramero oficial relaciona esa vía con su sector y contiene numeración positiva. No se deducen barrios por cercanía o semejanza de nombres.
4. Se excluyen sectores industriales, logísticos, empresariales, diseminados y equipamientos del bloque de referencias para viviendas. Los nombres de sectores son zonas de referencia: no todos son barrios administrativos.
5. Se seleccionan hasta ocho vías por zona. Se priorizan referencias editoriales conocidas y rangos numerados; se ha eliminado la preferencia automática por el tipo avenida y por la longitud total. No hay un mínimo para rellenar la ficha.
6. En Madrid y Torrelaguna se exige que al menos la mitad de la vía y 25 m de trazado pertenezcan al polígono oficial del barrio/núcleo, además del filtro residencial anterior. Los barrios sin vías elegibles se omiten de este bloque; no se retiran del directorio de distritos existente.
7. Las asignaciones expresamente documentadas por una fuente municipal pueden prevalecer sobre el filtro geométrico: los tramos residenciales de una vía mixta también son referencias válidas. Se marcan con `method: municipal` y sus fuentes.

Una calle puede aparecer en más de una zona porque sus tramos atraviesan sectores diferentes. No se asignan códigos postales a calles o barrios: se conserva el listado municipal y se pide confirmar el portal.

## Presentación y validación

Se muestran seis zonas y las restantes en un desplegable adicional; cada zona permite consultar sus calles. Los datos están en HTML y no necesitan JavaScript. En móvil se utiliza una columna y el tamaño común de texto de la web.

El snapshot incluye los hashes SHA-256 de las capas cartográficas utilizadas. La validación exige cobertura de 179 municipios, al menos una zona documentada por ficha, calles no duplicadas dentro de cada zona y códigos de sector del municipio correcto. Las pruebas protegen la selección aprobada de Coslada y San Fernando frente a la reaparición de Fuentemar, Industria, Astronomía, Artesanos y Sistema Solar.
