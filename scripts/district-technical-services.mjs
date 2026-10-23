import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {technicalBlock} from './technical-services.mjs';

// Retain the useful additional services introduced in districts, without
// shortening any original service explanation or changing municipal pages.
export function applyDistrictTechnicalServices(root='dist') {
  const districts=JSON.parse(fs.readFileSync('content/madrid-districts.json','utf8')).districts;
  for (const district of districts) {
    const file=path.join(root,'Antenas-Madrid',district.slug+'.html');
    const before=fs.readFileSync(file,'utf8');
    if (before.includes('id="soluciones-tecnicas"')) continue;
    const marker='<section class="section wrap faq">';
    assert.equal(before.split(marker).length,2,district.slug+': falta el destino de los trabajos técnicos');
    const block=technicalBlock(district.name,'district:'+district.slug);
    const after=before.replace(marker,()=>block+marker);
    assert.equal(after.replace(block,''),before,district.slug+': se modificó contenido existente');
    fs.writeFileSync(file,after);
  }
  console.log('TRABAJOS DE DISTRITO OK: 21 fichas con los servicios complementarios y las explicaciones originales completas.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) applyDistrictTechnicalServices(process.env.PRODUCTION_ROOT||'dist');
