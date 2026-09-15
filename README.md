# Antenas Rapid · renovación 0.1

Primera implementación navegable de revisión, independiente de Antenista Cerca. **No conectar todavía el dominio de la web actual.** El inventario preliminar se conserva en `docs/INVENTARIO-INICIAL.md`.

## Ver en Netlify

Importar el repositorio `billyn25/antenasrapid` y seleccionar:

| Campo | Valor |
| --- | --- |
| Rama | `main` |
| Directorio base | Vacío (raíz del repositorio) |
| Comando de construcción | `npm run build` |
| Directorio de publicación | `dist` |
| Node | `22`, ya configurado |

`netlify.toml` contiene la configuración. Mantener el dominio temporal `.netlify.app` y no enviar esta versión a Search Console. No hay que subir fotos ni archivos adicionales para esta primera revisión.

La aplicación permanece en modo de revisión aunque Netlify llame «production» al despliegue de `main`. Genera `noindex,nofollow` en HTML y cabeceras; no es un control de acceso privado. La activación real exige revisar la migración y cambiar expresamente la configuración. No modifica DNS ni el alojamiento existente.

## Incluido

Portada, cinco provincias y dos páginas locales iniciales: Bilbao y Lerma. Rutas conservadas con mayúsculas y `.html`. Servicios, teléfono, WhatsApp, abecedario y búsqueda en una selección inicial de municipios. Plantilla compartida con contenido y configuración propios, sin trasladar textos, logo, fotos ni Analytics de Antenista Cerca.

Esta versión utiliza una ilustración técnica y una marca tipográfica provisionales. Las fotografías originales y el inventario completo siguen pendientes. Son ocho páginas iniciales, no toda la web histórica ni una migración aprobada.

## Pruebas locales

Requiere Node 22 o posterior. Sin dependencias externas.

```sh
npm run build
npm run preview
```

Abrir `http://127.0.0.1:4173`. El build ejecuta las pruebas y después audita cada página generada. `npm test` ejecuta únicamente los tests. La carpeta `dist/` se genera; no se guarda en Git.

## Organización

- `config/site.json`: marca, dominio, teléfono y estado.
- `content/`: páginas, servicios, rutas y procedencia.
- `src/`: estilos e interacción sin seguimiento.
- `scripts/`: generador, auditor y servidor local.
- `tests/`: pruebas previas a la construcción.
- `docs/`: inventario preliminar, limitaciones y pruebas realizadas.

No se carga analítica, no hay formularios y no se utiliza almacenamiento del navegador. Los enlaces de teléfono y WhatsApp llevan al servicio real; no son un simulador de contacto. La información legal completa está pendiente de revisión.

## Antes de sustituir la web actual

Completar el inventario de URLs y su estado HTTP, revisar consultas y páginas con Search Console, recuperar recursos autorizados, confirmar cobertura y contenido, completar información legal, preparar copia de seguridad y mapa de redirecciones si fuera necesario. Comprobar la versión alojada y obtener autorización expresa para cambiar dominio o alojamiento.
