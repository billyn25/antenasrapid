import test from 'node:test';
import assert from 'node:assert/strict';
import {enhance,services} from '../scripts/burgos-bizkaia-services.mjs';
test('local service consultations select the form service and preserve canonical, escaping and idempotence',()=>{
 const source='<link rel="canonical" href="https://www.antenasrapid.com/antenas-bizkaia/test"><section class="section wrap faq" id="preguntas">';
 const name='Pueblo & "nombre"';
 const result=enhance(source,name,'Bizkaia','/antenas-bizkaia/');
 assert(result.startsWith(source.split('<section')[0]));
 assert.equal(enhance(result,name,'Bizkaia','/antenas-bizkaia/'),result);
 assert(result.includes('Pueblo &amp; &quot;nombre&quot;'));
 const consultations=[...result.matchAll(/<a\b[^>]*\bdata-contact-service="([^"]+)"[^>]*>/g)];
 assert.equal(consultations.length,6);
 assert.deepEqual(consultations.map(m=>m[1]).sort(),services.map(([id])=>id).sort());
 for(const [anchor] of consultations)assert.equal(anchor.match(/href="([^"]+)"/)?.[1],'#contacto');
 assert.ok(!/\bhref="(?:tel:|https?:\/\/wa\.me\/)/i.test(result));
 for(const [id] of services)assert(result.includes('/antenas-bizkaia/#revision-'+id));
});

test('province service guides select the form service and retain locality navigation',()=>{
 for(const province of ['Bizkaia','Burgos']){
  const route='/antenas-'+province.toLowerCase()+'/';
  const metadata=`<title>Servicios en ${province}</title><meta name="description" content="Consulta de servicios"><link rel="canonical" href="https://www.antenasrapid.com${route}">`;
  const source=metadata+'<section class="section wrap faq" id="preguntas">';
  const result=enhance(source,province,province,route,true);
  assert.ok(result.startsWith(metadata));
  assert.equal(enhance(result,province,province,route,true),result);
  const consultations=[...result.matchAll(/<a\b[^>]*\bdata-contact-service="([^"]+)"[^>]*>/g)];
  assert.equal(consultations.length,6);
  assert.deepEqual(consultations.map(m=>m[1]).sort(),services.map(([id])=>id).sort());
  for(const [anchor] of consultations)assert.equal(anchor.match(/href="([^"]+)"/)?.[1],'#contacto');
  assert.ok(!/\bhref="(?:tel:|https?:\/\/wa\.me\/)/i.test(result));
  assert.ok(result.includes('href="#localidades"'));
  for(const [id] of services)assert.ok(result.includes('id="revision-'+id+'"'));
 }
});
