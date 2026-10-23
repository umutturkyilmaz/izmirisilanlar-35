/**
 * Veritabanı yedeğini geri yükler (INSERT IGNORE — mevcut kayıtların üzerine yazmaz).
 *
 * Kullanım (server klasöründe, hedef veritabanı env değişkenleriyle):
 *   node scripts/restore-backup.mjs yedek.json.gz
 *
 * Önce API'yi bir kez başlatın ki tablolar oluşsun (ensureSchema).
 */
import 'dotenv/config';
import fs from 'node:fs';
import zlib from 'node:zlib';
import mysql from 'mysql2/promise';

const file = process.argv[2];
if (!file) {
  console.error('Kullanım: node scripts/restore-backup.mjs <yedek.json.gz>');
  process.exit(1);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function decodeValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object' && typeof v.__b64 === 'string') return Buffer.from(v.__b64, 'base64');
  if (typeof v === 'object') return JSON.stringify(v);
  if (typeof v === 'string' && ISO_DATE.test(v)) return new Date(v);
  return v;
}

const dump = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
console.log(`Yedek: ${dump.created_at} · dosyalar dahil: ${dump.include_blobs}`);

const conn = await mysql.createConnection({
  uri: process.env.DATABASE_URL || undefined,
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
});

await conn.query('SET FOREIGN_KEY_CHECKS = 0');
for (const [table, rows] of Object.entries(dump.tables)) {
  let inserted = 0;
  for (const row of rows) {
    const cols = Object.keys(row);
    if (!cols.length) continue;
    const sql = `INSERT IGNORE INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(', ')}) VALUES (${cols
      .map(() => '?')
      .join(', ')})`;
    try {
      const [r] = await conn.query(sql, cols.map((c) => decodeValue(row[c])));
      inserted += r.affectedRows || 0;
    } catch (e) {
      console.warn(`  ${table}: satır atlandı — ${e.message}`);
    }
  }
  console.log(`${table}: ${inserted}/${rows.length} eklendi`);
}
await conn.query('SET FOREIGN_KEY_CHECKS = 1');
await conn.end();
console.log('Tamamlandı.');
