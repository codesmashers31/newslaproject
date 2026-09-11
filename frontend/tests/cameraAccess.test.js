import test from 'node:test';
import assert from 'node:assert/strict';
import { startCompatibleCamera, cameraErrorMessage } from '../src/utils/cameraAccess.js';

test('rear camera starts without mandatory HD resolution or overriding video constraints', async () => {
  const calls = [];
  const config = { fps: 15 };
  await startCompatibleCamera({ start: async (...args) => calls.push(args) }, config, () => {});
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][0], { facingMode: 'environment' });
  assert.equal(calls[0][1].videoConstraints, undefined);
});

test('unavailable rear camera falls back to front camera', async () => {
  const calls = [];
  await startCompatibleCamera({ start: async (selection) => {
    calls.push(selection);
    if (calls.length === 1) throw { name: 'OverconstrainedError' };
  } }, {}, () => {});
  assert.deepEqual(calls, [{ facingMode: 'environment' }, { facingMode: 'user' }]);
});

test('permission denial does not repeat the permission request through fallback', async () => {
  let calls = 0;
  await assert.rejects(startCompatibleCamera({ start: async () => {
    calls++;
    throw new DOMException('Denied', 'NotAllowedError');
  } }, {}, () => {}), { name: 'NotAllowedError' });
  assert.equal(calls, 1);
});

for (const [name, expected] of [
  ['InsecureContextError', /HTTPS/],
  ['NotReadableError', /other apps or tabs/],
  ['NotFoundError', /No camera/],
  ['NotAllowedError', /settings/],
  ['UnsupportedCameraError', /Chrome or Safari/],
]) {
  test(`explains ${name} accurately`, () => assert.match(cameraErrorMessage({ name }), expected));
}
