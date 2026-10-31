import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../public/connected.js',import.meta.url),'utf8');
test('one unified six-screen application, not a nested or linked review page',()=>{
 assert.equal((html.match(/class="section(?: active)?"/g)||[]).length,6);
 assert.match(html,/src="\/connected\.js"/);
 assert.doesNotMatch(html,/href="\/interactive-review\.html"/);
});
test('all six genuine FastAPI routes bound to frontend',()=>{
 for(const route of ['/api/health','/api/sources','/api/forecast','/api/evaluate','/api/compare','/api/replan'])assert.ok(js.includes(route),route);
});
test('scientific cautions and unsupported-location guard remain',()=>{
 assert.match(js,/not farming safety advice|not field-validated agricultural advice/i);
 assert.match(js,/Only Jalna is supported/);
 assert.match(js,/No current forecast hours/);
});