import { getStore } from '@netlify/blobs';
import { verificarAuth } from './auth-utils.mjs';
import { allowedMigrationKey } from '../../lib/migration-scope.mjs';
import { createHash } from 'node:crypto';

export default async function handler(req) {
  const headers = { 'Cache-Control': 'no-store' };
  if (req.method !== 'GET') return new Response('Método no permitido', { status: 405, headers });
  const auth = await verificarAuth(req, 'sebas');
  if (!auth.ok) return Response.json({ error: auth.error }, { status: 401, headers });
  try {
    const store = getStore('comidas');
    const key = new URL(req.url).searchParams.get('key');
    if (!key) {
      const keys = [];
      for await (const page of store.list({ prefix: 'sebas:', paginate: true })) {
        keys.push(...page.blobs.map(blob => blob.key).filter(allowedMigrationKey));
      }
      return Response.json({ usuario: 'sebas', mes: '2026-09', keys: keys.sort() }, { headers });
    }
    if (!allowedMigrationKey(key)) return new Response('Fuera del alcance autorizado', { status: 403, headers });
    const entry = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    if (!entry) return new Response('No encontrado', { status: 404, headers });
    const bytes = Buffer.from(entry.data);
    return Response.json({ key, metadata: entry.metadata || {}, base64: bytes.toString('base64'), sha256: createHash('sha256').update(bytes).digest('hex') }, { headers });
  } catch {
    return Response.json({ error: 'No se pudo exportar el registro' }, { status: 500, headers });
  }
}
export const config = { path: '/api/migration-export' };
