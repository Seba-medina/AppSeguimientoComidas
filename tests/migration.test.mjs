import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedMigrationKey } from '../lib/migration-scope.mjs';
import { dispatch } from '../api/router.mjs';
import { routes } from '../lib/routes.mjs';

test('export and import only authorize sebas September and presets', () => {
  for (const key of ['sebas:2026-09-01:desayuno', 'sebas:2026-09-30:metricas', 'sebas:2026-09-10:extra:123-abc', 'sebas:presets']) assert.equal(allowedMigrationKey(key), true);
  for (const key of ['otro:2026-09-01:desayuno', 'sebas:password', 'sebas:2026-10-01:desayuno', 'sebas:2026-09-31:desayuno', 'sebas:2026-09-00:desayuno', 'sebas:2026-09-01:extra:../../otro', null]) assert.equal(allowedMigrationKey(key), false);
});

test('router preserves multipart image bytes and authentication header', async () => {
  routes.test = async req => {
    assert.equal(req.headers.get('x-user-password'), 'test-secret');
    const form = await req.formData();
    assert.equal(form.get('usuario'), 'sebas');
    assert.deepEqual(new Uint8Array(await form.get('foto').arrayBuffer()), new Uint8Array([0, 255, 128, 13, 10]));
    return Response.json({ ok: true });
  };
  try {
    const form = new FormData();
    form.set('usuario', 'sebas');
    form.set('foto', new Blob([new Uint8Array([0, 255, 128, 13, 10])], { type: 'image/jpeg' }), 'foto.jpg');
    const response = await dispatch(new Request('https://test/api/router?endpoint=test', { method: 'POST', headers: { 'x-user-password': 'test-secret' }, body: form }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { delete routes.test; }
});

test('router rejects unknown endpoints and preserves image response', async () => {
  assert.equal((await dispatch(new Request('https://test/api/router?endpoint=unknown'))).status, 404);
  routes.testImage = async () => new Response(new Uint8Array([0, 255, 128]), { headers: { 'content-type': 'image/jpeg' } });
  try {
    const response = await dispatch(new Request('https://test/api/router?endpoint=testImage'));
    assert.equal(response.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array([0, 255, 128]));
  } finally { delete routes.testImage; }
});

test('administrator cannot log in without configured password', async () => {
  delete process.env.ADMIN_PASSWORD;
  const response = await dispatch(new Request('https://test/api/auth-login', { method: 'POST', body: JSON.stringify({ usuario: 'admin', password: 'admin123' }), headers: { 'content-type': 'application/json' } }));
  assert.equal(response.status, 401);
});
