import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url=process.env.SUPABASE_URL||'';
const key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('SUPABASE_URL debe ser una URL HTTPS de Supabase');
if(!/^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.test(key))throw Error('SUPABASE_PUBLISHABLE_KEY inválida');
const out=path.join(root,'dist');await mkdir(out,{recursive:true});
for(const name of ['index.html','app.js','styles.css'])await copyFile(path.join(root,'commercial',name),path.join(out,name));
await writeFile(path.join(out,'config.js'),'export const FITOS_CONFIG = '+JSON.stringify({url,publishableKey:key})+';\n');
await writeFile(path.join(out,'_headers'),`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self'; connect-src 'self' ${url.replace(/\/$/,'')} wss://${new URL(url).host} https://cdn.jsdelivr.net; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
`);
console.log('FitOS commercial static bundle built. No private key exposed.');
