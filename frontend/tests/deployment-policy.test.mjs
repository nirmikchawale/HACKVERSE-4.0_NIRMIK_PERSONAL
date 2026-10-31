import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Guard the exact Hobby deployment allowlist. Vercel's authoritative
// minimatch behavior is documented at
// https://vercel.com/docs/project-configuration/git-configuration
const config=JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));

test('Hobby Git deployment policy allows only main and cert candidates',()=>{
  const selectors=config.git?.deploymentEnabled;
  assert.deepEqual(selectors,{'**':false,main:true,'release/cert-*':true});
  assert.equal(Object.keys(selectors).length,3);
  assert.equal(typeof selectors,'object');
  assert.equal(config.ignoreCommand,undefined,'Ignored Build Step counts toward quota: do not use it');
  assert.equal(config.github?.enabled,undefined,'Never disconnect Git production deployment');
});

test('branch examples obey the restricted allowlist',()=>{
  const selectors=config.git.deploymentEnabled;
  // These are the exact three allowed forms above, not a generic glob library.
  const matches=(branch,pattern)=>
    pattern==='**'||(pattern==='main'&&branch==='main')||
    (pattern==='release/cert-*'&&/^release\/cert-[^/]+$/.test(branch));
  const eligible=branch=>{
    const matched=Object.entries(selectors).filter(([pattern])=>matches(branch,pattern));
    assert.ok(matched.length,'All branch names must match the deny-all pattern');
    return matched.some(([,allowed])=>allowed===true);
  };
  for(const branch of ['main','release/cert-pr15','release/cert-governance-01'])
    assert.equal(eligible(branch),true,branch+' must trigger a deployment');
  for(const branch of ['expansion/ecc-dqnamo-action-quality-03',
    'ops/hobby-release-budget-01','feat/new-ui','bugfix/forecast',
    'release/random','release/cert-pr15/extra','docs/notes'])
    assert.equal(eligible(branch),false,branch+' must not trigger a deployment');
});

test('FastAPI and Vite services remain one app, unchanged routes',()=>{
  assert.equal(config.services.frontend.root,'frontend');
  assert.equal(config.services.frontend.framework,'vite');
  assert.equal(config.services.backend.root,'backend');
  assert.equal(config.services.backend.framework,'fastapi');
  assert.equal(config.services.backend.entrypoint,'main:app');
  assert.deepEqual(config.rewrites.map(x=>x.source),[
    '/api/(.*)','/openapi.json','/(.*)'
  ]);
  assert.deepEqual(config.rewrites[0].destination,{service:'backend'});
  assert.deepEqual(config.rewrites[1].destination,{service:'backend'});
  assert.deepEqual(config.rewrites[2].destination,{service:'frontend'});
});
