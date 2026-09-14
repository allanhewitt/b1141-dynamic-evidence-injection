import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');

test('lecturer view derives its visible title from configured activity metadata', () => {
  const lecturerStart = source.indexOf('async function lecturer');
  const presentationStart = source.indexOf('async function presentation');
  assert.notEqual(lecturerStart, -1, 'lecturer surface must exist');
  assert.ok(presentationStart > lecturerStart, 'presentation surface must follow lecturer surface');
  const lecturerSource = source.slice(lecturerStart, presentationStart);
  assert.match(lecturerSource, /\/presentation`\)/);
  assert.match(lecturerSource, /meta\.title \|\| activityId/);
  assert.doesNotMatch(lecturerSource, /<h1>\$\{esc\(activityId\)\}<\/h1>/);
});
