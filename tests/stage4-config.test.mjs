import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateConfig } from '../backend/lib/dei-domain.mjs';
import { PUBLIC_ALIASES } from '../frontend/public-aliases.js';

const activities = JSON.parse(fs.readFileSync(new URL('../backend/fixtures/activities.json', import.meta.url), 'utf8'));

test('Stage 4 defines exactly two inactive canonical B1141 DEI instances', () => {
  assert.equal(activities.length, 2);
  assert.deepEqual(activities.map(x => x.id), [
    'b1141-w2-who-dopes-dei',
    'b1141-w8-disclosure-sequence-dei'
  ]);
  assert.equal(activities.every(x => x.active === false), true);
  assert.equal(activities.every(x => x.schema_version === 1), true);
  for (const activity of activities) validateConfig(activity.config);
});

test('Stage 4 learner language is mechanism-neutral and does not cue movement', () => {
  const rendered = JSON.stringify(activities).toLowerCase();
  for (const forbidden of ['feel differently', 'how did views shift', 'injection', 'commitment', 'confrontation', 'resolution', '/respond/']) {
    assert.equal(rendered.includes(forbidden), false, `learner configuration contains forbidden wording: ${forbidden}`);
  }
  assert.equal(activities[0].config.results.heading, 'What changed — if anything?');
  assert.equal(activities[1].title, 'A Club Responds');
  assert.equal(activities[1].config.information[0].source_note, 'Fictional teaching scenario.');
});

test('Stage 4 public aliases are stable and map to the canonical rows', () => {
  assert.deepEqual(PUBLIC_ALIASES, {
    dei01: 'b1141-w2-who-dopes-dei',
    dei02: 'b1141-w8-disclosure-sequence-dei'
  });
});
