import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');

test('lecturer close requires explicit confirmation before the close request', () => {
  const closeHandlerStart = source.indexOf("document.querySelector('#close').onclick");
  assert.notEqual(closeHandlerStart, -1, 'close handler must exist');

  const closeHandler = source.slice(closeHandlerStart, closeHandlerStart + 900);
  const confirmIndex = closeHandler.indexOf('window.confirm(');
  const cancelGuardIndex = closeHandler.indexOf('if (!confirmed) return;');
  const closeRequestIndex = closeHandler.indexOf('/close`');

  assert.ok(confirmIndex >= 0, 'close handler must ask for confirmation');
  assert.ok(cancelGuardIndex > confirmIndex, 'cancel must return without closing');
  assert.ok(closeRequestIndex > cancelGuardIndex, 'close request must occur only after confirmation');
  assert.match(closeHandler, /Students will no longer be able to submit responses/);
});
