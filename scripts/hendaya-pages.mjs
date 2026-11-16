import fs from 'node:fs';
import {applyHendayaWork} from './hendaya-work.mjs';
import {applyHendayaService} from './hendaya-service.mjs';

// Generar los destinos enlazados desde portada y pie antes de auditar la vista previa.
fs.copyFileSync('src/regional-contact.css', 'dist/assets/regional-contact.css');
applyHendayaWork('dist', {includeReferences:false});
applyHendayaService('dist', {checkIrunLink:false});
