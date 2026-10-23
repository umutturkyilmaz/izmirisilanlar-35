import zlib from 'node:zlib';
import { promisify } from 'node:util';

const gzip = promisify(zlib.gzip);

/** Geri yüklemeye gerek olmayan geçici tablolar */
const SKIP_TABLES = new Set(['rate_limits', 'password_resets', 'email_verifications']);

/** Gmail eki sınırı 25 MB; base64 şişmesi payıyla */
export const EMAIL_ATTACHMENT_LIMIT = 17 * 1024 * 1024;

function encodeValue(v) {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return { __b64: v.toString('base64') };
  if (v instanceof Date) return v.toISOString();
  return v;
}

/**
 * Veritabanının mantıksal yedeği (JSON + gzip).
 * @param {import('mysql2/promise').Pool} pool
 * @param {{ includeBlobs?: boolean }} opts includeBlobs=false → uploaded_files.data hariç
 */
export async function createBackup(pool, { includeBlobs = true } = {}) {
  const [tableRows] = await pool.query('SHOW TABLES');
  const tables = tableRows.map((r) => Object.values(r)[0]).filter((t) => !SKIP_TABLES.has(t));
  const dump = { version: 1, created_at: new Date().toISOString(), include_blobs: includeBlobs, tables: {} };
  const counts = {};
  for (const table of tables) {
    let sql = `SELECT * FROM \`${table}\``;
    if (table === 'uploaded_files' && !includeBlobs) {
      const [cols] = await pool.query(`SHOW COLUMNS FROM \`uploaded_files\``);
      const keep = cols.map((c) => c.Field).filter((f) => f !== 'data');
      sql = `SELECT ${keep.map((f) => `\`${f}\``).join(', ')} FROM \`uploaded_files\``;
    }
    const [rows] = await pool.query(sql);
    dump.tables[table] = rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([k, v]) => [k, encodeValue(v)])),
    );
    counts[table] = rows.length;
  }
  const buffer = await gzip(Buffer.from(JSON.stringify(dump)), { level: 9 });
  const stamp = dump.created_at.slice(0, 16).replace(/[:T]/g, '-');
  return {
    buffer,
    filename: `izmirisilanlari35-yedek-${stamp}${includeBlobs ? '' : '-dosyasiz'}.json.gz`,
    counts,
    includeBlobs,
  };
}
