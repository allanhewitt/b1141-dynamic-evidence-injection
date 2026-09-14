import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../frontend/app.js', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../frontend/styles.css', import.meta.url), 'utf8');

test('student participant token is bound to activity and session', () => {
  assert.match(source, /gedl:dei:\$\{activityId\}:\$\{sessionId\}:participant/);
  assert.match(source, /token\(activityId, sessionId\)/);
});

test('portal-launched completion offers a fixed B1141 return action', () => {
  assert.match(source, /const PORTALS =/);
  assert.match(source, /gdl_portal/);
  assert.match(source, /Return to B1141 activities/);
  assert.doesNotMatch(source, /return_url/);
});

test('lecturer surface auto-attaches and supports deliberate fresh-run recovery', () => {
  const lecturerStart = source.indexOf('async function lecturer');
  const presentationStart = source.indexOf('async function presentation');
  const lecturerSource = source.slice(lecturerStart, presentationStart);
  assert.match(lecturerSource, /open-session/);
  assert.match(lecturerSource, /Waiting for the scheduled activity/);
  assert.match(lecturerSource, /Restart with fresh run/);
  const restartStart = lecturerSource.indexOf('restart.onclick');
  const restartBlock = lecturerSource.slice(restartStart, restartStart + 2600);
  const closeIndex = restartBlock.indexOf('/close`');
  const startIndex = restartBlock.indexOf('/sessions`');
  assert.ok(closeIndex >= 0, 'restart must close the abandoned run');
  assert.ok(startIndex > closeIndex, 'fresh session must be created only after the old run closes');
  assert.match(restartBlock, /nothing will carry into the new run/);
});

test('presentation follows the current open session and has an expressive movement map', () => {
  const presentationStart = source.indexOf('async function presentation');
  const presentationSource = source.slice(presentationStart);
  assert.match(presentationSource, /open-session/);
  assert.match(presentationSource, /setSurfaceTimer\(\(\) => void refresh\(\), 2500\)/);
  assert.match(source, /function movementMap/);
  assert.match(source, /movement-ribbon/);
  assert.match(source, /Initial judgement/);
  assert.match(source, /Revised judgement/);
});

test('surface doctrine is explicit in CSS', () => {
  assert.match(styles, /STUDENT — quiet, warm, mobile-first/);
  assert.match(styles, /LECTURER — operational and explicit/);
  assert.match(styles, /PRESENTATION — creative, room-scale and pedagogically expressive/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /#fff(?:fff)?\b/i);
});
