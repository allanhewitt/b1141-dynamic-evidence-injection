import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_ALIASES, resolveProductionRoute } from '../backend/production-server.mjs';

test('Stage 5 exposes exactly the two accepted DEI aliases', () => {
  assert.deepEqual(PRODUCTION_ALIASES, {
    dei01: 'b1141-w2-who-dopes-dei',
    dei02: 'b1141-w8-disclosure-sequence-dei'
  });
});

test('clean lecturer and presentation routes resolve to canonical activities', () => {
  assert.deepEqual(resolveProductionRoute('/control/dei01'), {
    kind: 'surface',
    surface: 'control',
    alias: 'dei01',
    activityId: 'b1141-w2-who-dopes-dei'
  });
  assert.deepEqual(resolveProductionRoute('/display/DEI02/'), {
    kind: 'surface',
    surface: 'display',
    alias: 'dei02',
    activityId: 'b1141-w8-disclosure-sequence-dei'
  });
});

test('activity-scoped API aliases resolve without widening the public alias set', () => {
  assert.deepEqual(resolveProductionRoute('/api/dei/activities/dei01/open-session'), {
    kind: 'api',
    alias: 'dei01',
    activityId: 'b1141-w2-who-dopes-dei',
    suffix: '/open-session'
  });
  assert.equal(resolveProductionRoute('/control/dei03'), null);
  assert.equal(resolveProductionRoute('/api/dei/activities/dei99'), null);
});
