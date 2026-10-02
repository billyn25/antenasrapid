# Madrid y códigos postales

## Alcance

Ampliación de Antenas Rapid con los 179 municipios de Madrid, sin modificar el dominio, teléfono, servicios ni rutas anteriores. Una página por municipio y un directorio provincial; no se crean páginas adicionales por código postal.

## Datos y mantenimiento

Los identificadores INE de los municipios y sus códigos postales son datos distintos. El inventario municipal conserva la fuente fijada que ya usa el proyecto. Solo para los municipios nuevos de Madrid se colocan al principio los artículos que el inventario guarda al final.

Las relaciones municipio/código postal proceden de los atributos de direcciones de CartoCiudad (IGN/CNIG), consultados mediante su API pública. Se incluyen fuente y fecha en `content/postal-codes-madrid.json`. No se almacenan ni se publican direcciones individuales. La correspondencia postal se guarda en el repositorio: no se consulta el servicio externo durante cada build ni al navegar por la web.

Obra derivada de CartoCiudad CC BY 4.0 scne.es. Información del servicio: https://www.cartociudad.es/web/portal/directorio-de-servicios/descarga

La extracción del 2 de octubre de 2026 leyó 930450 registros de direcciones de la provincia. La fuente incluye «Los Baldios» como ámbito adicional; se excluye porque no forma parte de los 179 municipios del inventario INE. Se conservan 395 relaciones entre municipio y código postal, correspondientes a 296 códigos distintos. Las direcciones sin un código válido no generan asignaciones inventadas.

La lista informa de los códigos asociados a las direcciones presentes en esa fuente; no certifica todos los códigos de usos especiales de Correos. Un municipio puede tener varios códigos y uno puede compartirse entre municipios. Para una dirección concreta se debe confirmar calle y código postal.

## Presentación y comprobaciones

El directorio permite buscar por municipio (sin tildes) o por código postal. Un código compartido muestra todos los municipios que lo tienen asociado. Los códigos se incluyen como texto HTML en la página municipal y los listados largos se despliegan, sin crear URLs nuevas. No se declaran como dirección fiscal o sede de la empresa en datos estructurados.

`npm run build:production` comprueba la cobertura, los 179 municipios y su correspondencia exacta con la lista postal, los servicios, las 180 URLs del sitemap de Madrid y el total de 3227 municipios en 16 provincias. Las pruebas unitarias cubren códigos compartidos, Madrid capital, conservación de metadatos y que no se alteren otras provincias.
