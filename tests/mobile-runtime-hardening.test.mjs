import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');

test('student token creation tolerates older or restricted mobile browser runtimes', () => {
  assert.match(source, /globalThis\.crypto/);
  assert.match(source, /c\?\.randomUUID/);
  assert.match(source, /c\?\.getRandomValues/);
  assert.match(source, /memoryToken/);
  assert.match(source, /catch\{/);
});

test('top-level router awaits async surfaces so startup failures render an error screen', () => {
  assert.match(source, /await student\(publicRoute\.activityId/);
  assert.match(source, /await student\(parts\[1\],params\)/);
  assert.match(source, /await lecturer\(parts\[1\],params\)/);
  assert.match(source, /await presentation\(parts\[1\],params\)/);
  assert.match(source, /Something went wrong/);
});
