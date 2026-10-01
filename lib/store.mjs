import { neon } from '@neondatabase/serverless';

let sql;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL');
  return sql ||= neon(process.env.DATABASE_URL);
}

export function getStore(name) {
  if (name !== 'comidas') throw new Error('Almacenamiento desconocido');
  const read = async (key, options = {}) => {
    const rows = await database()`SELECT encode(data, 'hex') AS hex, metadata FROM comidas WHERE key = ${key}`;
    if (!rows.length) return null;
    const bytes = Buffer.from(rows[0].hex, 'hex');
    const data = options.type === 'arrayBuffer'
      ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
      : options.type === 'json' ? JSON.parse(bytes.toString('utf8')) : bytes.toString('utf8');
    return { data, metadata: rows[0].metadata };
  };
  return {
    async get(key, options) { return (await read(key, options))?.data ?? null; },
    getWithMetadata: read,
    async set(key, value, options = {}) {
      const bytes = typeof value === 'string' ? Buffer.from(value) : Buffer.from(value);
      await database()`INSERT INTO comidas (key, data, metadata)
        VALUES (${key}, decode(${bytes.toString('hex')}, 'hex'), ${JSON.stringify(options.metadata || {})}::jsonb)
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, metadata = EXCLUDED.metadata`;
    },
    async setJSON(key, value) { await this.set(key, JSON.stringify(value)); },
    async delete(key) { await database()`DELETE FROM comidas WHERE key = ${key}`; },
    async list({ prefix = '' } = {}) {
      const rows = await database()`SELECT key FROM comidas WHERE starts_with(key, ${prefix}) ORDER BY key`;
      return { blobs: rows.map(({ key }) => ({ key })) };
    }
  };
}
