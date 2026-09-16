import fs from 'node:fs';
import path from 'node:path';

const source = path.join('src', 'logo-antenasrapid-clean.webp.b64');
const target = path.join('dist', 'assets', 'logo-antenasrapid.webp');

fs.mkdirSync(path.dirname(target), { recursive: true });
const encoded = fs.readFileSync(source, 'utf8').trim();
fs.writeFileSync(target, Buffer.from(encoded, 'base64'));
console.log('ASSET OK: logo-antenasrapid.webp limpio');
