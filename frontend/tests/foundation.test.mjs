import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const ts = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

test('foundation includes the four product workflow landmarks', () => {
  for (const id of ['step-weather-title', 'step-time-title', 'step-resources-title', 'step-results-title']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('foundation labels missing live data instead of using fake forecasts', () => {
  assert.match(html, /Live data: unavailable/);
  assert.match(html, /Decision: not calculated/);
  assert.match(html, /Not field-validated|Not field-validated/i);
  assert.match(ts, /Python API and live forecast integration are pending/);
});

test('HTML includes the TypeScript entrypoint and responsive stylesheet', () => {
  assert.match(html, /src="\/src\/main\.ts"/);
  assert.match(css, /@media \(max-width: 660px\)/);
  assert.match(css, /prefers-reduced-motion/);
});
