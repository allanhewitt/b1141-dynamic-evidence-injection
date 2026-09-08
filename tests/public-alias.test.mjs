import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { resolvePublicAlias, PUBLIC_ALIASES } from '../frontend/public-aliases.js';
import { SqliteStore } from '../backend/storage/sqlite-store.mjs';
import { createServer } from '../backend/server.mjs';

test('DEI public aliases resolve without exposing route actions or canonical IDs', () => {
  assert.deepEqual(resolvePublicAlias('/dei01'), { alias: 'dei01', activityId: 'b1141-w2-who-dopes-dei' });
  assert.deepEqual(resolvePublicAlias('/dei02'), { alias: 'dei02', activityId: 'b1141-w8-disclosure-sequence-dei' });
  assert.equal(resolvePublicAlias('/respond/b1141-w2-who-dopes-dei'), null);
  assert.equal(resolvePublicAlias('/dei03'), null);
  for (const alias of Object.keys(PUBLIC_ALIASES)) {
    assert.match(alias, /^dei\d{2}$/);
    assert.equal(alias.includes('respond'), false);
  }
});

test('server serves only configured clean DEI student alias paths', async t => {
  process.env.DEI_SEED_ACTIVE = '1';
  const store = new SqliteStore(':memory:');
  const { server } = await createServer({ store });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.close(); store.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/dei01`)).status, 200);
  assert.equal((await fetch(`${base}/dei02`)).status, 200);
  assert.equal((await fetch(`${base}/dei03`)).status, 404);
  assert.equal((await fetch(`${base}/assets/public-aliases.js`)).status, 200);
});
