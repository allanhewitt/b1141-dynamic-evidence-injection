import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');

test('lecturer UI waits for the schedule instead of exposing the old manual start workflow', () => {
  assert.match(source, /Waiting for the scheduled activity/);
  assert.match(source, /This view will attach automatically when the CRUD availability window opens/);
  assert.doesNotMatch(source, />Start session</);
  assert.match(source, /Restart with fresh run/);
  assert.match(source, /End session/);
});

test('closed state remains explicit for pinned or explicitly loaded sessions', () => {
  assert.match(source, /const closed = data\.status === 'closed'/);
  assert.match(source, /closed \? 'Session ended' : 'Session open'/);
});
