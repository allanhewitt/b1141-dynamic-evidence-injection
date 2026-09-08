import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('lecturer UI exposes closed state and hides the close action once closed', () => {
  const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');
  assert.match(source, /Session status:/);
  assert.match(source, /closed=d\.status==='closed'/);
  assert.match(source, /closed\?'Closed':'Open'/);
  assert.match(source, /closed\?'':'<button id="close"/);
  assert.match(source, /if\(close\)close\.onclick/);
});
