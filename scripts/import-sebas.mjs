import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { database } from '../lib/store.mjs';
import { allowedMigrationKey } from '../lib/migration-scope.mjs';

const filename = process.argv[2];
if (!filename) throw new Error('Uso: node --env-file=.env.local scripts/import-sebas.mjs backup-sebas-2026-09.json');
const backup = JSON.parse(await readFile(filename, 'utf8'));
if (backup.version !== 1 || backup.usuario !== 'sebas' || backup.mes !== '2026-09' || !Array.isArray(backup.entries)) throw new Error('Copia incompatible');
const seen = new Set();
const entries = backup.entries.map(entry => {
  if (!allowedMigrationKey(entry.key) || seen.has(entry.key) || typeof entry.base64 !== 'string') throw new Error('Clave inválida o duplicada');
  seen.add(entry.key);
  const bytes = Buffer.from(entry.base64, 'base64');
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Copia dañada: ' + entry.key);
  return { ...entry, hex: bytes.toString('hex') };
});
if (!entries.length) throw new Error('La copia no contiene registros; no se modificó el destino');
const sql = database();
await sql`CREATE TABLE IF NOT EXISTS comidas (key text PRIMARY KEY, data bytea NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb)`;
const account = await sql`SELECT key FROM comidas WHERE key = 'sebas:password'`;
if (!account.length) throw new Error('Primero registrá la cuenta sebas en la app nueva, con tu contraseña elegida.');
// Atomic import. Existing records must match exactly; never overwrite newer data.
await sql.transaction(entries.map(entry => sql`INSERT INTO comidas (key, data, metadata)
  VALUES (${entry.key}, decode(${entry.hex}, 'hex'), ${JSON.stringify(entry.metadata || {})}::jsonb)
  ON CONFLICT (key) DO NOTHING`));
let verified = 0;
for (const entry of entries) {
  const rows = await sql`SELECT encode(data, 'hex') AS hex, metadata FROM comidas WHERE key = ${entry.key}`;
  const stable = value => JSON.stringify(value, Object.keys(value).sort());
  if (rows[0]?.hex !== entry.hex || stable(rows[0].metadata) !== stable(entry.metadata || {})) throw new Error('Conflicto con un registro existente; no se sobrescribió: ' + entry.key);
  verified++;
}
console.log(`Importación verificada: ${verified} registros de sebas, septiembre de 2026.`);
