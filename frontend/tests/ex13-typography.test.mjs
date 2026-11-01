import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source=readFileSync(new URL('../public/connected.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/agri-typography.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('one stylesheet is loaded for the existing six-screen dashboard',()=>{
  assert.equal((html.match(/<section[^>]+data-page="[0-5]"/g)||[]).length,6);
  assert.equal((source.match(/typographyStyle\.href='\/agri-typography\.css'/g)||[]).length,1);
  assert.match(source,/document\.head\.append\(typographyStyle\)/);
});
test('responsive accessible type scale preserves typography roles and focus',()=>{
  for(const token of ['--m3-body-large','--m3-label-small','--af-page-title','--af-card-title','--af-font'])assert.ok(css.includes(token),token);
  assert.match(css,/@media\s*\(max-width:\s*740px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
test('Apple system font is referenced only; no unlicensed binary is embedded',()=>{
  assert.match(css,/-apple-system/);
  assert.doesNotMatch(css,/@font-face\s*\{[^}]*SF Pro/is);
  assert.doesNotMatch(css,/fonts\.cdnfonts\.com|apple-fonts\.s3/i);
});
