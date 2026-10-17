import test from 'node:test';
import assert from 'node:assert/strict';
import {enhance,services} from '../scripts/burgos-bizkaia-services.mjs';
test('local service consultations preserve canonical and escape locality names',()=>{
 const source='<link rel="canonical" href="https://www.antenasrapid.com/antenas-bizkaia/test"><section class="section wrap faq" id="preguntas">';
 const name='Pueblo & "nombre"';
 const result=enhance(source,name,'Bizkaia','/antenas-bizkaia/');
 assert(result.startsWith(source.split('<section')[0]));
 assert.equal(enhance(result,name,'Bizkaia','/antenas-bizkaia/'),result);
 assert(result.includes('Pueblo &amp; &quot;nombre&quot;'));
 const urls=[...result.matchAll(/href="(https:\/\/wa.me\/[^"\s]+)"/g)].map(m=>new URL(m[1]));
 assert.equal(urls.length,6);
 for(const u of urls){assert(u.searchParams.get('text').includes(name+', Bizkaia'));assert.equal(u.pathname,'/34641589394');}
 for(const [id] of services)assert(result.includes('/antenas-bizkaia/#revision-'+id));
});
