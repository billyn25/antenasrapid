import fs from 'node:fs';
import path from 'node:path';

const source = path.join('src', 'logo-antenasrapid.webp');
const target = path.join('dist', 'assets', 'logo-antenasrapid.webp');

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log('ASSET OK: logo-antenasrapid.webp');
