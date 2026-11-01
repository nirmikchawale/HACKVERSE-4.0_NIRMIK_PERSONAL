import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

// Exercise the exact pure validator shipped by the six-screen browser runtime.
const source = readFileSync(new URL('../public/connected.js', import.meta.url), 'utf8');
const begin = source.indexOf('  function isValidISTDeadline(value){');
const end = source.indexOf('  function requestFromForm(){', begin);
assert.ok(begin >= 0 && end > begin, 'deadline validator must precede API submission');
const validate = runInNewContext(source.slice(begin, end) + '\n isValidISTDeadline;', { Date, Number });

test('accepts real IST calendar dates, including leap days', () => {
  assert.equal(validate('2028-02-29T23:59'), true);
  assert.equal(validate('2026-11-01T06:30'), true);
});

test('rejects impossible day/month combinations before FastAPI submission', () => {
  for (const date of [
    '2026-02-29T12:00', '2026-04-31T10:30', '2026-13-01T10:30',
    '2026-00-10T10:30', '2026-11-00T10:30', '2026-11-32T10:30',
    '2026-11-01T24:00', '2026-11-01T12:60',
    '2026-11-01', 'not-a-date', '', null,
  ]) assert.equal(validate(date), false, String(date));
});

test('actual request path applies calendar validator rather than regex alone', () => {
  const request = source.slice(end, source.indexOf('  function validateEvaluation(', end));
  assert.match(request, /if\(!isValidISTDeadline\(state\.deadline\)\)/);
});
