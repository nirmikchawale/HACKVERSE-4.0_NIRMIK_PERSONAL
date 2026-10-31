import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../', import.meta.url);
const html=readFileSync(new URL('index.html',root),'utf8');
const css=readFileSync(new URL('public/agri-typography.css',root),'utf8');
const alternate=readFileSync(new URL('src/style.css',root),'utf8');

test('whole six-page dashboard receives the final shared typography stylesheet',()=>{
  assert.equal((html.match(/<section[^>]+data-page="[0-5]"/g)||[]).length,6);
  assert.match(html,/<link rel="stylesheet" href="\/agri-typography\.css">/);
  assert.match(html,/https:\/\/rsms\.me\/inter\/inter\.css/);
  assert.match(css,/--af-font:\s*-apple-system, BlinkMacSystemFont, "Inter"/);
  assert.match(css,/--af-page-title/);
  assert.match(css,/--af-section-title/);
  assert.match(css,/--af-control/);
  assert.match(css,/max-width:740px/);
  assert.match(css,/prefers-reduced-motion/);
});

test('Apple font binaries are not bundled or loaded from unlicensed sources',()=>{
  assert.doesNotMatch(css,/@font-face\s*\{[^}]*SF Pro/is);
  assert.doesNotMatch(html,/<link[^>]*(?:applefont|sfpro)[^>]*>/i);
  assert.doesNotMatch(css,/fonts\.cdnfonts\.com|apple-fonts\.s3/i);
  assert.match(css,/Inter \(SIL OFL 1\.1\)/);
  assert.match(alternate,/rsms\.me\/inter\/inter\.css/);
});
