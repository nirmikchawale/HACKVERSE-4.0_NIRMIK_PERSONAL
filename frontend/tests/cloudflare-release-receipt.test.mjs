import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=readFileSync(new URL('../scripts/prepare-cloudflare-release.mjs',import.meta.url),'utf8');
test('Cloudflare release manifest is generated from Git HEAD, never hardcoded',()=>{
 assert.match(source,/execFileSync\('git',\['rev-parse','HEAD'\]/);
 assert.match(source,/frontend','public','_release\.json/);
 assert.doesNotMatch(source,/api[_-]?token|CLOUDFLARE_API_TOKEN/i);
});
test('public Worker receipt gate validates the exact SHA',()=>{
 const smoke=readFileSync(new URL('../backend/scripts/cloudflare-smoke.mjs',import.meta.url),'utf8');
 assert.match(smoke,/DEPLOYMENT_MISMATCH/);
 assert.match(smoke,/EXPECTED_SHA/);
 assert.match(smoke,/REQUIRE_LIVE_CLIMATE/);
});
