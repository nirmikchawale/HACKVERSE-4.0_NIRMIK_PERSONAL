import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

test('Cloudflare public certificate installs frontend dependencies without an absent lockfile',()=>{
 const here=dirname(fileURLToPath(import.meta.url));
 const workflow=readFileSync(resolve(here,'../../.github/workflows/cfm04-public-certificate.yml'),'utf8');
 const pkg=JSON.parse(readFileSync(resolve(here,'../package.json'),'utf8'));
 assert.match(workflow,/name: CFM-04 Cloudflare Public Production Certification/);
 assert.match(workflow,/npm install/);
 if(!existsSync(resolve(here,'../package-lock.json'))) {
  assert.doesNotMatch(workflow,/run:\s*npm ci(?:\s|$)/m);
 }
 assert.ok(pkg.devDependencies?.['@playwright/test'],'Browser test dependencies must be installed');
});