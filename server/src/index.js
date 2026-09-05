import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { isIyzicoReady, initializeCheckoutForm, retrieveCheckoutForm } from './iyzico.js';
import {
  isMailReady,
  sendPasswordResetEmail,
  sendContactAckEmail,
  sendContactNotifyEmail,
  sendNewApplicationEmail,
  sendEmployerVerifiedEmail,
  sendApplicationStatusEmail,
  sendEmailVerification,
} from './mail.js';
import { OAuth2Client } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-change-me';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
/** Google giriş kapalı; açmak için GOOGLE_AUTH_ENABLED=true + GOOGLE_CLIENT_ID */
const GOOGLE_AUTH_ENABLED = process.env.GOOGLE_AUTH_ENABLED === 'true';
const GOOGLE_CLIENT_ID = GOOGLE_AUTH_ENABLED ? process.env.GOOGLE_CLIENT_ID || '' : '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function makeJobSlug(title, id) {
  const base = String(title || 'ilan')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const short = String(id || '').replace(/-/g, '').slice(0, 8);
  return `${base || 'ilan'}-${short}`;
}

function uid() {
  return crypto.randomUUID();
}

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || JWT_SECRET === 'dev-change-me')) {
  console.error('FATAL: JWT_SECRET production ortamında zorunlu');
  process.exit(1);
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL || undefined,
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id VARCHAR(80) PRIMARY KEY,
      mime VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
      data LONGBLOB NOT NULL,
      is_private TINYINT(1) NOT NULL DEFAULT 0,
      owner_id CHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  for (const sql of [
    `ALTER TABLE uploaded_files ADD COLUMN is_private TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE uploaded_files ADD COLUMN owner_id CHAR(36) NULL`,
    `ALTER TABLE users ADD COLUMN google_id VARCHAR(128) NULL`,
    `ALTER TABLE users ADD UNIQUE INDEX uq_users_google (google_id)`,
    `ALTER TABLE jobs ADD COLUMN credit_id CHAR(36) NULL`,
    `ALTER TABLE contact_messages ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0`,
    `ALTER TABLE jobs ADD COLUMN slug VARCHAR(191) NULL`,
    `ALTER TABLE jobs ADD UNIQUE INDEX uq_jobs_slug (slug)`,
    `ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 1`,
  ]) {
    try {
      await pool.query(sql);
    } catch {
      /* already exists */
    }
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      token CHAR(64) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pr_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verifications (
      token CHAR(64) PRIMARY KEY,
      user_id CHAR(36) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_ev_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id_key VARCHAR(191) PRIMARY KEY,
      hit_count INT NOT NULL DEFAULT 0,
      window_start DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // Mevcut ilanlara slug backfill
  try {
    const [needSlug] = await pool.query(`SELECT id, title FROM jobs WHERE slug IS NULL OR slug = '' LIMIT 500`);
    for (const row of needSlug) {
      const slug = makeJobSlug(row.title, row.id);
      try {
        await pool.query('UPDATE jobs SET slug = ? WHERE id = ?', [slug, row.id]);
      } catch {
        await pool.query('UPDATE jobs SET slug = ? WHERE id = ?', [`${slug}-${row.id.slice(0, 6)}`, row.id]);
      }
    }
  } catch (e) {
    console.warn('slug backfill', e.message);
  }
}

const app = express();
app.set('trust proxy', 1);
const SITE_ORIGINS = (
  process.env.CORS_ORIGINS ||
  process.env.PUBLIC_SITE_URL ||
  'https://izmirisilanlari35.com,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || SITE_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production') {
        return cb(null, true);
      }
      return cb(null, SITE_ORIGINS.includes(origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

const ALLOWED_UPLOAD_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const ALLOWED_UPLOAD_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);

/** Disk + MySQL: Railway redeploy disk siler; DB kalıcıdır. Private dosyalar /api/files üzerinden. */
app.get('/uploads/:filename', async (req, res) => {
  const filename = path.basename(req.params.filename || '');
  if (!filename || filename.includes('..')) return res.status(400).end();
  try {
    const [rows] = await pool.query(
      'SELECT mime, data, is_private FROM uploaded_files WHERE id = :id LIMIT 1',
      { id: filename },
    );
    if (rows[0]?.is_private) {
      return res.status(401).json({ error: 'Bu dosya için yetkili indirme gerekli' });
    }
    if (rows[0]?.data) {
      res.setHeader('Content-Type', rows[0].mime || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(rows[0].data);
    }
  } catch (e) {
    console.error('upload serve db', e.message);
  }
  const fp = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(fp)) {
    return res.sendFile(fp);
  }
  return res.status(404).json({ error: 'Dosya bulunamadı' });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ALLOWED_UPLOAD_MIME.has(file.mimetype) && ALLOWED_UPLOAD_EXT.has(ext)) {
      return cb(null, true);
    }
    cb(new Error('Yalnızca JPG, PNG, WebP, GIF veya PDF yüklenebilir'));
  },
});

async function checkRateLimitDb(key, maxHits, windowMs) {
  const now = new Date();
  const [rows] = await pool.query('SELECT hit_count, window_start FROM rate_limits WHERE id_key = ? LIMIT 1', [
    key,
  ]);
  const row = rows[0];
  if (!row) {
    await pool.query('INSERT INTO rate_limits (id_key, hit_count, window_start) VALUES (?, 1, ?)', [key, now]);
    return { ok: true };
  }
  const start = new Date(row.window_start).getTime();
  if (now.getTime() - start > windowMs) {
    await pool.query('UPDATE rate_limits SET hit_count = 1, window_start = ? WHERE id_key = ?', [now, key]);
    return { ok: true };
  }
  if (row.hit_count >= maxHits) {
    const retryAfterSec = Math.ceil((windowMs - (now.getTime() - start)) / 1000);
    return { ok: false, retryAfterSec };
  }
  await pool.query('UPDATE rate_limits SET hit_count = hit_count + 1 WHERE id_key = ?', [key]);
  return { ok: true };
}

function filePublicOrPrivateUrl(req, filename, isPrivate) {
  const base = (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  if (isPrivate) return `${base}/api/files/${filename}`;
  return `${base}/uploads/${filename}`;
}

function publicUrl(req, filename) {
  if (!filename) return null;
  const base = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return `${base.replace(/\/$/, '')}/uploads/${filename}`;
}

function signUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '14d' },
  );
}

function profileRow(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return {
    ...rest,
    email_verified: row.email_verified === undefined ? true : !!row.email_verified,
  };
}

async function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Giriş gerekli' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: payload.id });
    if (!rows[0]) return res.status(401).json({ error: 'Kullanıcı yok' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Oturum geçersiz' });
  }
}

function optionalAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err || !payload?.id) return next();
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE id = :id LIMIT 1', { id: payload.id });
      req.user = rows[0] || null;
    } catch {
      /* ignore */
    }
    next();
  });
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'izmir-api', health: '/api/health' });
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      ok: true,
      db: true,
      mail: isMailReady(),
      google: Boolean(GOOGLE_CLIENT_ID),
    });
  } catch (e) {
    res.status(503).json({ ok: false, db: false, error: e.message });
  }
});

// ---- Auth ----
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      role = 'candidate',
      full_name,
      phone,
      city,
      company_name,
      vergi_numarasi,
    } = req.body || {};
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'E-posta ve en az 6 karakter şifre gerekli' });
    }
    if (!['candidate', 'employer'].includes(role)) {
      return res.status(400).json({ error: 'Geçersiz rol' });
    }
    const id = uid();
    const hash = await bcrypt.hash(password, 10);
    const pending = role === 'employer' && vergi_numarasi;
    await pool.query(
      `INSERT INTO users
      (id, email, password_hash, role, full_name, phone, city, company_name, vergi_numarasi, dogrulama_durumu, dogrulama_talebi_tarihi, email_verified)
      VALUES (:id, :email, :hash, :role, :full_name, :phone, :city, :company_name, :vergi, :durum, :talep, 0)`,
      {
        id,
        email: String(email).trim().toLowerCase(),
        hash,
        role,
        full_name: full_name || null,
        phone: phone || null,
        city: city || null,
        company_name: role === 'employer' ? company_name || null : null,
        vergi: role === 'employer' ? vergi_numarasi || null : null,
        durum: pending ? 'pending' : 'unverified',
        talep: pending ? new Date() : null,
      },
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id });
    const user = rows[0];
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      `INSERT INTO email_verifications (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [verifyToken, id],
    );
    void sendEmailVerification(user.email, verifyToken);
    const token = signUser(user);
    res.json({
      token,
      user: profileRow(user),
      profile: profileRow(user),
      message: 'Kayıt başarılı. E-posta doğrulama bağlantısı gönderildi (SMTP açıksa).',
    });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu e-posta kayıtlı' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
    const rl = await checkRateLimitDb(`login:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.ok) {
      return res.status(429).json({ error: 'Çok fazla deneme. Bir süre sonra tekrar deneyin.', retryAfterSec: rl.retryAfterSec });
    }
    const { email, password } = req.body || {};
    const [rows] = await pool.query('SELECT * FROM users WHERE email = :email LIMIT 1', {
      email: String(email || '').trim().toLowerCase(),
    });
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }
    res.json({ token: signUser(user), user: profileRow(user), profile: profileRow(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/change-password', auth, async (req, res) => {
  const current = String(req.body?.current_password || '');
  const next = String(req.body?.new_password || '');
  if (next.length < 6) return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
  const ok = await bcrypt.compare(current, req.user.password_hash || '');
  if (!ok) return res.status(400).json({ error: 'Mevcut şifre hatalı' });
  const hash = await bcrypt.hash(next, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ ok: true, message: 'Şifre güncellendi' });
});

app.post('/api/auth/verify-email', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!token) return res.status(400).json({ error: 'Token gerekli' });
  const [rows] = await pool.query(
    'SELECT * FROM email_verifications WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token],
  );
  const row = rows[0];
  if (!row) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş bağlantı' });
  await pool.query('UPDATE users SET email_verified = 1 WHERE id = ?', [row.user_id]);
  await pool.query('DELETE FROM email_verifications WHERE user_id = ?', [row.user_id]);
  res.json({ ok: true, message: 'E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.' });
});

app.post('/api/auth/resend-verification', auth, async (req, res) => {
  if (req.user.email_verified) {
    return res.json({ ok: true, message: 'E-posta zaten doğrulanmış' });
  }
  if (!isMailReady()) {
    return res.status(503).json({ error: 'E-posta servisi şu an kapalı' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  await pool.query('DELETE FROM email_verifications WHERE user_id = ?', [req.user.id]);
  await pool.query(
    `INSERT INTO email_verifications (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
    [token, req.user.id],
  );
  await sendEmailVerification(req.user.email, token);
  res.json({ ok: true, message: 'Doğrulama e-postası gönderildi' });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: profileRow(req.user), profile: profileRow(req.user) });
});

app.patch('/api/auth/profile', auth, async (req, res) => {
  try {
    const allowed = ['full_name', 'company_name', 'phone', 'city', 'bio', 'avatar_url', 'cv_url', 'vergi_numarasi'];
    const sets = [];
    const params = { id: req.user.id };
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = :${key}`);
        params[key] = req.body[key];
      }
    }
    // İşveren vergi no güncellerse doğrulama talebi (kullanıcı status atlayamaz)
    if (
      req.user.role === 'employer' &&
      req.body.vergi_numarasi !== undefined &&
      req.user.dogrulama_durumu !== 'verified'
    ) {
      sets.push('dogrulama_durumu = :dogrulama_durumu');
      sets.push('dogrulama_talebi_tarihi = NOW()');
      params.dogrulama_durumu = 'pending';
    }
    if (!sets.length) return res.status(400).json({ error: 'Güncellenecek alan yok' });
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = :id`, params);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
    res.json({ profile: profileRow(rows[0]) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();
  const generic = {
    ok: true,
    mailConfigured: isMailReady(),
    message: isMailReady()
      ? 'Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderilir. Gelen kutusu ve spam klasörünü kontrol edin.'
      : 'E-posta servisi henüz yapılandırılmadı. Şimdilik iletişim formundan yazın; SMTP eklenince sıfırlama maili çalışacak.',
  };
  if (!email) return res.json(generic);
  try {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
    const rl = await checkRateLimitDb(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) return res.status(429).json({ error: 'Çok fazla istek', retryAfterSec: rl.retryAfterSec });

    const [rows] = await pool.query('SELECT id, email FROM users WHERE email = :e LIMIT 1', { e: email });
    const user = rows[0];
    if (user && isMailReady()) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);
      await pool.query('INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)', [
        token,
        user.id,
        expires,
      ]);
      await sendPasswordResetEmail(user.email, token);
    }
  } catch (e) {
    console.error('forgot-password', e.message);
  }
  res.json(generic);
});

app.post('/api/auth/reset-password', async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = String(req.body?.password || '');
  if (!token || password.length < 6) {
    return res.status(400).json({ error: 'Geçerli token ve en az 6 karakter şifre gerekli' });
  }
  const [rows] = await pool.query(
    'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW() LIMIT 1',
    [token],
  );
  const row = rows[0];
  if (!row) return res.status(400).json({ error: 'Bağlantı geçersiz veya süresi dolmuş' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.user_id]);
  await pool.query('DELETE FROM password_resets WHERE user_id = ?', [row.user_id]);
  res.json({ ok: true, message: 'Şifreniz güncellendi. Giriş yapabilirsiniz.' });
});

app.get('/api/auth/google/status', (_req, res) => {
  res.json({
    enabled: Boolean(GOOGLE_CLIENT_ID),
    clientId: GOOGLE_CLIENT_ID || null,
    note: GOOGLE_AUTH_ENABLED ? null : 'Google giriş kapalı (GOOGLE_AUTH_ENABLED)',
  });
});

app.post('/api/auth/google', async (req, res) => {
  if (!GOOGLE_AUTH_ENABLED || !googleClient || !GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google girişi kapalı' });
  }
  try {
    const credential = req.body?.credential;
    if (!credential) return res.status(400).json({ error: 'credential gerekli' });
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return res.status(401).json({ error: 'Google doğrulaması başarısız' });
    }
    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const fullName = payload.name || null;
    const avatar = payload.picture || null;
    const roleWanted = ['candidate', 'employer'].includes(req.body?.role) ? req.body.role : 'candidate';

    let [rows] = await pool.query(
      'SELECT * FROM users WHERE google_id = :g OR email = :e LIMIT 1',
      { g: googleId, e: email },
    );
    let user = rows[0];
    if (!user) {
      const id = uid();
      const hash = await bcrypt.hash(crypto.randomUUID(), 10);
      let companyName = null;
      let vergi = null;
      let dogrulama = 'unverified';
      if (roleWanted === 'employer') {
        companyName = String(req.body?.company_name || req.body?.companyName || '').trim() || null;
        vergi = String(req.body?.vergi_numarasi || req.body?.vergiNumarasi || '').replace(/\D/g, '');
        if (!vergi || vergi.length !== 10) {
          return res.status(400).json({ error: 'İşveren Google kaydı için 10 haneli vergi numarası gerekli' });
        }
        dogrulama = 'pending';
      }
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, full_name, avatar_url, google_id, company_name, vergi_numarasi, dogrulama_durumu)
         VALUES (:id, :email, :hash, :role, :full_name, :avatar, :google_id, :company_name, :vergi, :dogrulama)`,
        {
          id,
          email,
          hash,
          role: roleWanted,
          full_name: fullName,
          avatar,
          google_id: googleId,
          company_name: companyName,
          vergi,
          dogrulama,
        },
      );
      [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id });
      user = rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = :g, avatar_url = COALESCE(avatar_url, :a) WHERE id = :id', {
        g: googleId,
        a: avatar,
        id: user.id,
      });
      [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: user.id });
      user = rows[0];
    }
    const token = signUser(user);
    res.json({ token, user: profileRow(user), profile: profileRow(user) });
  } catch (e) {
    console.error('google auth', e.message);
    res.status(401).json({ error: 'Google girişi başarısız' });
  }
});

// ---- Upload ----
app.post('/api/upload', auth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Yükleme hatası' });
    if (!req.file) return res.status(400).json({ error: 'Dosya yok' });
    const ext = path.extname(req.file.originalname || '').slice(0, 12).toLowerCase();
    const filename = `${crypto.randomUUID()}${ext}`;
    const mime = req.file.mimetype || 'application/octet-stream';
    const isPrivate =
      req.query.private === '1' ||
      req.query.private === 'true' ||
      mime === 'application/pdf';
    try {
      await pool.query(
        'INSERT INTO uploaded_files (id, mime, data, is_private, owner_id) VALUES (?, ?, ?, ?, ?)',
        [filename, mime, req.file.buffer, isPrivate ? 1 : 0, req.user.id],
      );
    } catch (e) {
      console.error('upload save', e.message);
      return res.status(500).json({ error: 'Dosya kaydedilemedi' });
    }
    if (!isPrivate) {
      try {
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer);
      } catch {
        /* disk opsiyonel */
      }
    }
    res.json({
      url: filePublicOrPrivateUrl(req, filename, isPrivate),
      filename,
      private: isPrivate,
    });
  });
});

/** Private CV / dosya — sahibi, ilgili işveren veya admin */
app.get('/api/files/:filename', auth, async (req, res) => {
  const filename = path.basename(req.params.filename || '');
  if (!filename) return res.status(400).json({ error: 'Dosya yok' });
  const [rows] = await pool.query('SELECT * FROM uploaded_files WHERE id = ? LIMIT 1', [filename]);
  const file = rows[0];
  if (!file) return res.status(404).json({ error: 'Dosya bulunamadı' });
  const isOwner = file.owner_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  let isEmployerViewer = false;
  if (!isOwner && !isAdmin && req.user.role === 'employer') {
    const [apps] = await pool.query(
      `SELECT a.id FROM applications a
       INNER JOIN jobs j ON j.id = a.job_id
       WHERE j.employer_id = ? AND a.cv_url LIKE ? LIMIT 1`,
      [req.user.id, `%${filename}%`],
    );
    isEmployerViewer = Boolean(apps[0]);
  }
  if (!isOwner && !isAdmin && !isEmployerViewer) {
    return res.status(403).json({ error: 'Yetki yok' });
  }
  res.setHeader('Content-Type', file.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(file.data);
});

// ---- Categories ----
app.get('/api/categories', async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, icon, sort_order FROM job_categories ORDER BY sort_order ASC');
  res.json(rows);
});

// ---- Jobs ----
async function expireOutdatedJobs() {
  await pool.query(
    `UPDATE jobs SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()`,
  );
}

app.get('/api/jobs', optionalAuth, async (req, res) => {
  try {
    await expireOutdatedJobs();
    const { status, featured, employer_id, q, city, sector, job_type, limit = '50' } = req.query;
    const where = [];
    const params = {};
    const isAdmin = req.user?.role === 'admin';
    const uid = req.user?.id;

    if (employer_id) {
      const canSeeAll = isAdmin || (uid && String(employer_id) === String(uid));
      where.push('employer_id = :employer_id');
      params.employer_id = employer_id;
      if (!canSeeAll) {
        where.push(`status = 'active'`);
      } else if (status) {
        where.push('status = :status');
        params.status = status;
      }
    } else if (status) {
      where.push('status = :status');
      params.status = status;
    } else if (!isAdmin) {
      where.push(`(status = 'active' OR employer_id = :viewer)`);
      params.viewer = uid || '__none__';
    }
    if (featured === '1' || featured === 'true') where.push('featured = 1');
    if (city) {
      where.push('city LIKE :city');
      params.city = `%${city}%`;
    }
    if (sector) {
      where.push('sector LIKE :sector');
      params.sector = `%${sector}%`;
    }
    if (job_type) {
      where.push('job_type = :job_type');
      params.job_type = job_type;
    }
    if (q) {
      where.push('(title LIKE :q OR company_name LIKE :q OR description LIKE :q)');
      params.q = `%${q}%`;
    }
    const sql = `SELECT * FROM jobs ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC LIMIT ${Math.min(Number(limit) || 50, 200)}`;
    const [rows] = await pool.query(sql, params);
    const jobs = rows.map(parseJob);
    await sanitizeJobImages(jobs);
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/jobs/stats', async (_req, res) => {
  const [[{ c: jobs }]] = await pool.query(`SELECT COUNT(*) c FROM jobs WHERE status = 'active'`);
  const [companies] = await pool.query(
    `SELECT DISTINCT company_name FROM jobs WHERE status = 'active' AND company_name IS NOT NULL AND company_name != ''`,
  );
  const [[{ c: employers }]] = await pool.query(
    `SELECT COUNT(*) c FROM users WHERE role = 'employer' AND dogrulama_durumu = 'verified'`,
  );
  const [[{ c: candidates }]] = await pool.query(`SELECT COUNT(*) c FROM users WHERE role = 'candidate'`);
  const [[{ c: apps }]] = await pool.query(
    `SELECT COUNT(*) c FROM applications WHERE status IN ('accepted','reviewed')`,
  );
  res.json({
    activeJobs: jobs,
    companies: companies.length || employers,
    candidates,
    successfulApplications: apps,
  });
});

app.get('/api/jobs/:id', optionalAuth, async (req, res) => {
  const key = req.params.id;
  const [rows] = await pool.query(
    'SELECT * FROM jobs WHERE id = :id OR slug = :id LIMIT 1',
    { id: key },
  );
  const job = rows[0];
  if (!job) return res.status(404).json({ error: 'İlan yok' });
  const can =
    job.status === 'active' ||
    req.user?.id === job.employer_id ||
    req.user?.role === 'admin';
  if (!can) return res.status(404).json({ error: 'İlan yok' });
  const parsed = parseJob(job);
  await sanitizeJobImages(parsed);
  res.json(parsed);
});

app.post('/api/jobs', auth, async (req, res) => {
  if (!['employer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'İşveren gerekli' });
  }
  if (req.user.role === 'employer' && req.user.dogrulama_durumu !== 'verified') {
    return res.status(403).json({ error: 'İşveren hesabı henüz doğrulanmadı' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const b = req.body || {};
    const isAdmin = req.user.role === 'admin';
    let featured = Boolean(b.featured);
    let expiresAt = b.expires_at ? new Date(b.expires_at) : null;
    const title = String(b.title || '').trim() || (isAdmin ? 'İlan' : '');
    if (!title) {
      await conn.rollback();
      return res.status(400).json({ error: 'İlan başlığı gerekli' });
    }
    const categoryRaw = Number(b.category_id);
    const categoryId = Number.isFinite(categoryRaw) && categoryRaw > 0 ? categoryRaw : null;

    if (!isAdmin && !b.credit_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Paket hakkı gerekli' });
    }

    if (isAdmin && !b.credit_id) {
      const days = Number(b.duration_days) || 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    let usedCreditId = null;
    if (b.credit_id && !isAdmin) {
      const [creditRows] = await conn.query(
        `SELECT * FROM employer_credits WHERE id = :id AND employer_id = :uid AND remaining > 0 LIMIT 1 FOR UPDATE`,
        { id: b.credit_id, uid: req.user.id },
      );
      const credit = creditRows[0];
      if (!credit) {
        await conn.rollback();
        return res.status(400).json({ error: 'Geçerli paket hakkı bulunamadı' });
      }
      await conn.query(`UPDATE employer_credits SET remaining = remaining - 1 WHERE id = :id`, {
        id: credit.id,
      });
      featured = !!credit.featured;
      expiresAt = new Date(Date.now() + (credit.duration_days || 7) * 24 * 60 * 60 * 1000);
      usedCreditId = credit.id;
    }

    const id = uid();
    const slug = makeJobSlug(title, id);
    await conn.query(
      `INSERT INTO jobs
      (id, employer_id, title, category_id, sector, description, company_name, city, job_type, experience_level,
       salary_min, salary_max, requirements, benefits, image_url, status, featured, expires_at, credit_id, slug)
      VALUES
      (:id, :employer_id, :title, :category_id, :sector, :description, :company_name, :city, :job_type, :experience_level,
       :salary_min, :salary_max, :requirements, :benefits, :image_url, :status, :featured, :expires_at, :credit_id, :slug)`,
      {
        id,
        employer_id: req.user.id,
        title,
        category_id: categoryId,
        sector: b.sector || null,
        description: b.description || null,
        company_name: b.company_name || (isAdmin ? 'İzmir İş İlanları 35' : null),
        city: b.city || null,
        job_type: b.job_type || null,
        experience_level: b.experience_level || null,
        salary_min: b.salary_min ?? null,
        salary_max: b.salary_max ?? null,
        requirements: b.requirements ? JSON.stringify(b.requirements) : null,
        benefits: b.benefits ? JSON.stringify(b.benefits) : null,
        image_url: b.image_url || null,
        status: isAdmin ? b.status || 'active' : b.status || 'pending',
        featured: featured ? 1 : 0,
        expires_at: expiresAt,
        credit_id: usedCreditId,
        slug,
      },
    );
    const [rows] = await conn.query('SELECT * FROM jobs WHERE id = :id', { id });
    await conn.commit();
    res.status(201).json(parseJob(rows[0]));
  } catch (e) {
    await conn.rollback();
    console.error('POST /api/jobs', e);
    res.status(500).json({ error: e.message || 'İlan kaydedilemedi' });
  } finally {
    conn.release();
  }
});

app.patch('/api/jobs/:id', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM jobs WHERE id = :id OR slug = :id', { id: req.params.id });
  const job = rows[0];
  if (!job) return res.status(404).json({ error: 'İlan yok' });
  if (job.employer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetki yok' });
  }
  const isAdmin = req.user.role === 'admin';
  const employerAllowed = [
    'title',
    'description',
    'city',
    'salary_min',
    'salary_max',
    'sector',
    'job_type',
    'experience_level',
    'company_name',
    'image_url',
    'requirements',
    'benefits',
    'category_id',
  ];
  const adminOnly = ['status', 'featured', 'expires_at'];
  const allowed = isAdmin ? [...employerAllowed, ...adminOnly] : employerAllowed;
  const sets = [];
  const params = { id: job.id };
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      sets.push(`${key} = :${key}`);
      let v = req.body[key];
      if (key === 'requirements' || key === 'benefits') v = JSON.stringify(v);
      if (key === 'featured') v = v ? 1 : 0;
      if (key === 'expires_at' && v) v = new Date(v);
      if (key === 'status') {
        const ok = ['pending', 'active', 'rejected', 'closed', 'expired'];
        if (!ok.includes(v)) return res.status(400).json({ error: 'Geçersiz durum' });
      }
      if (key === 'category_id') {
        const n = Number(v);
        v = Number.isFinite(n) && n > 0 ? n : null;
      }
      params[key] = v;
    }
  }
  // İşveren kendi ilanını kapatabilir
  if (!isAdmin && req.body.status === 'closed') {
    sets.push('status = :status');
    params.status = 'closed';
  }
  if (!sets.length) return res.status(400).json({ error: 'Boş güncelleme' });

  // Reddedilince paket hakkını iade et (bir kez)
  if (isAdmin && req.body.status === 'rejected' && job.status === 'pending' && job.credit_id) {
    await pool.query(`UPDATE employer_credits SET remaining = remaining + 1 WHERE id = :id`, {
      id: job.credit_id,
    });
    sets.push('credit_id = NULL');
  }

  await pool.query(`UPDATE jobs SET ${sets.join(', ')} WHERE id = :id`, params);
  const [next] = await pool.query('SELECT * FROM jobs WHERE id = :id', { id: job.id });
  res.json(parseJob(next[0]));
});

/** Paket hakkı ile ilan yenileme (atomik) */
app.post('/api/jobs/:id/renew', auth, async (req, res) => {
  if (!['employer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Yetki yok' });
  }
  const creditId = req.body?.credit_id;
  if (!creditId) return res.status(400).json({ error: 'Paket hakkı gerekli' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [jobs] = await conn.query(
      'SELECT * FROM jobs WHERE id = :id OR slug = :id LIMIT 1 FOR UPDATE',
      { id: req.params.id },
    );
    const job = jobs[0];
    if (!job) {
      await conn.rollback();
      return res.status(404).json({ error: 'İlan yok' });
    }
    if (job.employer_id !== req.user.id && req.user.role !== 'admin') {
      await conn.rollback();
      return res.status(403).json({ error: 'Yetki yok' });
    }
    const [credits] = await conn.query(
      `SELECT * FROM employer_credits WHERE id = :id AND employer_id = :uid AND remaining > 0 LIMIT 1 FOR UPDATE`,
      { id: creditId, uid: req.user.id },
    );
    const credit = credits[0];
    if (!credit) {
      await conn.rollback();
      return res.status(400).json({ error: 'Geçerli paket hakkı bulunamadı' });
    }
    await conn.query(`UPDATE employer_credits SET remaining = remaining - 1 WHERE id = :id`, {
      id: credit.id,
    });
    const expires = new Date(Date.now() + (credit.duration_days || 7) * 24 * 60 * 60 * 1000);
    await conn.query(
      `UPDATE jobs SET status = 'active', featured = :featured, expires_at = :exp WHERE id = :id`,
      { featured: credit.featured ? 1 : 0, exp: expires, id: job.id },
    );
    await conn.commit();
    const [next] = await pool.query('SELECT * FROM jobs WHERE id = :id', { id: job.id });
    res.json(parseJob(next[0]));
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message || 'Yenileme başarısız' });
  } finally {
    conn.release();
  }
});

function parseJob(row) {
  if (!row) return row;
  const j = { ...row, featured: !!row.featured };
  if (typeof j.requirements === 'string') {
    try {
      j.requirements = JSON.parse(j.requirements);
    } catch {
      /* keep */
    }
  }
  if (typeof j.benefits === 'string') {
    try {
      j.benefits = JSON.parse(j.benefits);
    } catch {
      /* keep */
    }
  }
  return j;
}

function uploadFilenameFromUrl(url) {
  const m = String(url || '').match(/\/uploads\/([^/?#]+)$/i);
  return m ? m[1] : null;
}

/** Redeploy’da silinen disk dosyaları için kırık image_url’i temizle */
async function sanitizeJobImages(jobs) {
  const list = Array.isArray(jobs) ? jobs : jobs ? [jobs] : [];
  if (!list.length) return jobs;
  const names = [...new Set(list.map((j) => uploadFilenameFromUrl(j.image_url)).filter(Boolean))];
  if (!names.length) return jobs;
  let ok = new Set();
  try {
    const [rows] = await pool.query(
      `SELECT id FROM uploaded_files WHERE id IN (${names.map(() => '?').join(',')})`,
      names,
    );
    ok = new Set(rows.map((r) => r.id));
  } catch (e) {
    console.error('sanitizeJobImages', e.message);
  }
  const deadJobIds = [];
  for (const j of list) {
    const fn = uploadFilenameFromUrl(j.image_url);
    if (!fn) continue;
    if (ok.has(fn) || fs.existsSync(path.join(UPLOAD_DIR, fn))) continue;
    j.image_url = null;
    if (j.id) deadJobIds.push(j.id);
  }
  if (deadJobIds.length) {
    pool
      .query(`UPDATE jobs SET image_url = NULL WHERE id IN (${deadJobIds.map(() => '?').join(',')})`, deadJobIds)
      .catch(() => {});
  }
  return jobs;
}

// ---- Applications ----
app.post('/api/applications', auth, async (req, res) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({ error: 'Yalnızca adaylar başvurabilir' });
  }
  if (isMailReady() && !req.user.email_verified) {
    return res.status(403).json({
      error: 'Başvuru için önce e-posta adresinizi doğrulayın. Profilinizden tekrar gönderebilirsiniz.',
    });
  }
  try {
    const { job_id, cover_letter, cv_url } = req.body || {};
    if (!job_id) return res.status(400).json({ error: 'İlan gerekli' });
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = :id LIMIT 1', { id: job_id });
    const job = jobs[0];
    if (!job || job.status !== 'active') {
      return res.status(400).json({ error: 'Bu ilana başvuru yapılamaz' });
    }
    if (job.expires_at && new Date(job.expires_at) < new Date()) {
      return res.status(400).json({ error: 'İlan süresi dolmuş' });
    }
    const id = uid();
    await pool.query(
      `INSERT INTO applications (id, job_id, candidate_id, cover_letter, cv_url, status)
       VALUES (:id, :job_id, :candidate_id, :cover_letter, :cv_url, 'pending')`,
      {
        id,
        job_id,
        candidate_id: req.user.id,
        cover_letter: cover_letter || null,
        cv_url: cv_url || null,
      },
    );
    if (job.employer_id) {
      const notifId = uid();
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, body, link, \`read\`)
         VALUES (:id, :user_id, :title, :body, :link, 0)`,
        {
          id: notifId,
          user_id: job.employer_id,
          title: 'Yeni başvuru',
          body: `"${job.title}" ilanına yeni başvuru geldi.`,
          link: '/profil/isveren',
        },
      );
      const [empRows] = await pool.query('SELECT email FROM users WHERE id = ? LIMIT 1', [job.employer_id]);
      void sendNewApplicationEmail(empRows[0]?.email, job.title);
    }
    res.status(201).json({ id });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Zaten başvurdunuz' });
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/applications/mine', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, j.title AS job_title, j.slug AS job_slug, j.company_name, j.city, j.sector
     FROM applications a
     LEFT JOIN jobs j ON j.id = a.job_id
     WHERE a.candidate_id = :id
     ORDER BY a.created_at DESC`,
    { id: req.user.id },
  );
  res.json(rows);
});

app.get('/api/applications/employer', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, j.title AS job_title, u.full_name AS candidate_name, u.email AS candidate_email, u.phone AS candidate_phone
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     LEFT JOIN users u ON u.id = a.candidate_id
     WHERE j.employer_id = :id OR :role = 'admin'
     ORDER BY a.created_at DESC`,
    { id: req.user.id, role: req.user.role },
  );
  res.json(rows);
});

app.patch('/api/applications/:id', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, j.employer_id, j.title AS job_title, u.email AS candidate_email
     FROM applications a
     INNER JOIN jobs j ON j.id = a.job_id
     LEFT JOIN users u ON u.id = a.candidate_id
     WHERE a.id = :id`,
    { id: req.params.id },
  );
  const row = rows[0];
  if (!row) return res.status(404).json({ error: 'Yok' });
  if (row.employer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetki yok' });
  }
  const status = req.body?.status;
  const allowed = ['pending', 'reviewed', 'accepted', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz başvuru durumu' });
  }
  const prev = row.status;
  await pool.query(`UPDATE applications SET status = :status WHERE id = :id`, {
    id: req.params.id,
    status,
  });
  if (prev !== status && row.candidate_id) {
    const labels = {
      pending: 'Değerlendiriliyor',
      reviewed: 'İncelendi',
      accepted: 'Kabul edildi',
      rejected: 'Reddedildi',
    };
    const notifId = uid();
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, body, link, \`read\`) VALUES (?, ?, ?, ?, ?, 0)`,
      [
        notifId,
        row.candidate_id,
        'Başvuru durumu güncellendi',
        `"${row.job_title}" → ${labels[status] || status}`,
        '/basvurularim',
      ],
    );
    void sendApplicationStatusEmail(row.candidate_email, row.job_title, status);
  }
  res.json({ ok: true });
});

// ---- Favorites ----
app.get('/api/favorites', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT f.id, f.job_id, f.created_at, j.title, j.slug, j.company_name, j.city, j.sector, j.job_type, j.salary_min, j.salary_max, j.status AS job_status
     FROM favorites f
     INNER JOIN jobs j ON j.id = f.job_id
     WHERE f.user_id = :id
     ORDER BY f.created_at DESC`,
    { id: req.user.id },
  );
  res.json(rows);
});

app.post('/api/favorites', auth, async (req, res) => {
  const id = uid();
  try {
    await pool.query(`INSERT INTO favorites (id, user_id, job_id) VALUES (:id, :user_id, :job_id)`, {
      id,
      user_id: req.user.id,
      job_id: req.body.job_id,
    });
    res.status(201).json({ id });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Zaten favoride' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/favorites/:id', auth, async (req, res) => {
  await pool.query(`DELETE FROM favorites WHERE id = :id AND user_id = :uid`, {
    id: req.params.id,
    uid: req.user.id,
  });
  res.json({ ok: true });
});

// ---- Credits / payments ----
app.get('/api/credits', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM employer_credits WHERE employer_id = :id AND remaining > 0 ORDER BY created_at ASC`,
    { id: req.user.id },
  );
  res.json(rows.map((r) => ({ ...r, featured: !!r.featured })));
});

app.get('/api/payments/iyzico/status', (_req, res) => {
  res.json({
    enabled: isIyzicoReady(),
    sandbox: process.env.IYZICO_SANDBOX !== 'false',
    message: isIyzicoReady()
      ? 'iyzico hazır (Checkout Form)'
      : 'iyzico kapalı — API anahtarları bekleniyor; test modunda kredi anında tanımlanır',
  });
});

async function grantCreditsForPayment(payment, meta) {
  const [existing] = await pool.query(
    `SELECT id FROM employer_credits WHERE payment_id = :pid LIMIT 1`,
    { pid: payment.id },
  );
  if (existing[0]) return existing[0].id;

  const count = meta.credits_count || 1;
  const featuredCount = meta.featured_count ?? (meta.featured ? count : 0);
  let firstId = null;

  for (let i = 0; i < count; i++) {
    const creditId = uid();
    const isFeatured = i < featuredCount;
    await pool.query(
      `INSERT INTO employer_credits
      (id, employer_id, payment_id, package_id, package_name, duration_days, featured, remaining)
      VALUES
      (:id, :employer_id, :payment_id, :package_id, :package_name, :duration_days, :featured, 1)`,
      {
        id: creditId,
        employer_id: payment.employer_id,
        payment_id: payment.id,
        package_id: payment.package_id,
        package_name: payment.package_name,
        duration_days: meta.duration_days || 7,
        featured: isFeatured ? 1 : 0,
      },
    );
    if (!firstId) firstId = creditId;
  }
  return firstId;
}

app.post('/api/payments/checkout', auth, async (req, res) => {
  try {
    if (!['employer', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Paket yalnızca işverenler için' });
    }
    const b = req.body || {};
    const paymentId = uid();
    const pkgId = b.package_id || '';
    const creditsCount = pkgId === 'kurumsal' ? 5 : 1;
    const featuredCount =
      pkgId === 'kurumsal' ? 2 : pkgId === 'one-cikan' || Boolean(b.featured) ? creditsCount : 0;
    const meta = {
      duration_days: b.duration_days || 7,
      featured: featuredCount > 0,
      featured_count: featuredCount,
      credits_count: creditsCount,
    };

    await pool.query(
      `INSERT INTO job_payments
      (id, employer_id, package_id, package_name, amount, currency, status, buyer_name, buyer_email, buyer_phone, company_name, tax_id, billing_address, credits_meta)
      VALUES
      (:id, :employer_id, :package_id, :package_name, :amount, 'TRY', :status, :buyer_name, :buyer_email, :buyer_phone, :company_name, :tax_id, :billing_address, :credits_meta)`,
      {
        id: paymentId,
        employer_id: req.user.id,
        package_id: b.package_id,
        package_name: b.package_name,
        amount: b.amount,
        status: isIyzicoReady() ? 'pending_iyzico' : 'test_paid',
        buyer_name: b.buyer_name || null,
        buyer_email: b.buyer_email || null,
        buyer_phone: b.buyer_phone || null,
        company_name: b.company_name || null,
        tax_id: b.tax_id || null,
        billing_address: b.billing_address || null,
        credits_meta: JSON.stringify(meta),
      },
    );

    // Anahtar yoksa: test/geçiş modu — kredi hemen (iyzico gelince bu dal kapanır)
    if (!isIyzicoReady()) {
      const creditId = await grantCreditsForPayment(
        {
          id: paymentId,
          employer_id: req.user.id,
          package_id: b.package_id,
          package_name: b.package_name,
        },
        meta,
      );
      await pool.query(`UPDATE job_payments SET status = 'test_paid' WHERE id = :id`, { id: paymentId });
      return res.status(201).json({
        mode: 'test',
        payment_id: paymentId,
        credit_id: creditId,
        message: 'iyzico anahtarları yok — test modunda hak tanımlandı',
      });
    }

    const publicApi = (process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      '',
    );
    const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.VITE_PUBLIC_SITE_URL || 'https://izmirisilanlari35.com').replace(
      /\/$/,
      '',
    );
    const nameParts = String(b.buyer_name || 'Musteri').trim().split(/\s+/);
    const init = await initializeCheckoutForm({
      conversationId: paymentId,
      basketId: paymentId,
      price: b.amount,
      packageId: b.package_id,
      packageName: b.package_name,
      callbackUrl: `${publicApi}/api/payments/iyzico/callback`,
      buyer: {
        id: req.user.id,
        name: nameParts[0] || 'Musteri',
        surname: nameParts.slice(1).join(' ') || 'Hesap',
        email: b.buyer_email || req.user.email,
        gsmNumber: b.buyer_phone || '+905350000000',
        identityNumber: (b.tax_id || '11111111111').replace(/\D/g, '').slice(0, 11) || '11111111111',
        address: b.billing_address || 'Turkiye',
        city: 'Izmir',
        ip: req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '85.34.78.112',
      },
    });

    await pool.query(
      `UPDATE job_payments SET iyzico_token = :token, status = 'pending_iyzico' WHERE id = :id`,
      { token: init.token, id: paymentId },
    );

    res.status(201).json({
      mode: 'iyzico',
      payment_id: paymentId,
      token: init.token,
      paymentPageUrl: init.paymentPageUrl,
      returnSiteUrl: `${siteUrl}/odeme/basarili?paket=${encodeURIComponent(b.package_id)}&payment=${paymentId}`,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Ödeme başlatılamadı' });
  }
});

/** iyzico Checkout Form callback (POST token) */
app.post('/api/payments/iyzico/callback', express.urlencoded({ extended: true }), async (req, res) => {
  const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://izmirisilanlari35.com').replace(/\/$/, '');
  try {
    const token = req.body?.token || req.query?.token;
    if (!token) {
      return res.redirect(`${siteUrl}/odeme/iptal?reason=no_token`);
    }
    const result = await retrieveCheckoutForm(token);
    const paymentId = result.conversationId;
    const [rows] = await pool.query(`SELECT * FROM job_payments WHERE id = :id LIMIT 1`, {
      id: paymentId,
    });
    const payment = rows[0];
    if (!payment) {
      return res.redirect(`${siteUrl}/odeme/iptal?reason=payment_not_found`);
    }

    if (result.paymentStatus === 'SUCCESS' || result.status === 'success') {
      let meta = { duration_days: 7, featured: false, credits_count: 1 };
      try {
        meta = typeof payment.credits_meta === 'string'
          ? JSON.parse(payment.credits_meta)
          : payment.credits_meta || meta;
      } catch {
        /* keep default */
      }
      await pool.query(
        `UPDATE job_payments SET status = 'paid', iyzico_payment_id = :pid WHERE id = :id`,
        { pid: result.paymentId || result.paymentIdList || token, id: paymentId },
      );
      await grantCreditsForPayment(payment, meta);
      return res.redirect(
        `${siteUrl}/odeme/basarili?paket=${encodeURIComponent(payment.package_id)}&payment=${paymentId}&ok=1`,
      );
    }

    await pool.query(`UPDATE job_payments SET status = 'failed' WHERE id = :id`, { id: paymentId });
    return res.redirect(`${siteUrl}/odeme/iptal?reason=failed`);
  } catch (e) {
    console.error('iyzico callback', e);
    return res.redirect(`${siteUrl}/odeme/iptal?reason=error`);
  }
});

app.get('/api/payments/:id', auth, async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM job_payments WHERE id = :id LIMIT 1`, {
    id: req.params.id,
  });
  const p = rows[0];
  if (!p) return res.status(404).json({ error: 'Yok' });
  if (p.employer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Yetki yok' });
  }
  const { credits_meta, ...rest } = p;
  res.json(rest);
});

app.post('/api/credits/:id/consume', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM employer_credits WHERE id = :id AND employer_id = :uid AND remaining > 0 LIMIT 1`,
    { id: req.params.id, uid: req.user.id },
  );
  const c = rows[0];
  if (!c) return res.status(404).json({ error: 'Kredi yok' });
  await pool.query(`UPDATE employer_credits SET remaining = remaining - 1 WHERE id = :id`, { id: c.id });
  const [next] = await pool.query(`SELECT * FROM employer_credits WHERE id = :id`, { id: c.id });
  res.json({ ...next[0], featured: !!next[0].featured });
});

app.get('/api/payments', auth, async (req, res) => {
  const admin = req.user.role === 'admin';
  const [rows] = await pool.query(
    admin
      ? `SELECT * FROM job_payments ORDER BY created_at DESC LIMIT 200`
      : `SELECT * FROM job_payments WHERE employer_id = :id ORDER BY created_at DESC`,
    { id: req.user.id },
  );
  res.json(rows);
});

// ---- Notifications / contact ----
app.get('/api/notifications', auth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, title, body, link, \`read\`, created_at FROM notifications WHERE user_id = :id ORDER BY created_at DESC LIMIT 50`,
    { id: req.user.id },
  );
  res.json(rows.map((r) => ({ ...r, read: !!r.read })));
});

app.post('/api/notifications', auth, async (req, res) => {
  // Non-admin yalnızca kendine bildirim oluşturabilir (spam/yanlış hedef engeli)
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bildirim oluşturma yetkisi yok' });
  }
  const targetUserId = req.body.user_id;
  if (!targetUserId) return res.status(400).json({ error: 'user_id gerekli' });
  const id = uid();
  await pool.query(
    `INSERT INTO notifications (id, user_id, title, body, link, \`read\`) VALUES (:id, :user_id, :title, :body, :link, 0)`,
    {
      id,
      user_id: targetUserId,
      title: req.body.title,
      body: req.body.body,
      link: req.body.link || null,
    },
  );
  res.status(201).json({ id });
});

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  await pool.query(`UPDATE notifications SET \`read\` = 1 WHERE id = :id AND user_id = :uid`, {
    id: req.params.id,
    uid: req.user.id,
  });
  res.json({ ok: true });
});

app.post('/api/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip;
  const rl = await checkRateLimitDb(`contact:${ip}`, 8, 60 * 60 * 1000);
  if (!rl.ok) {
    return res.status(429).json({
      error: 'Çok fazla istek. Lütfen sonra tekrar deneyin.',
      retryAfterSec: rl.retryAfterSec,
    });
  }
  const id = uid();
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Eksik alan' });
  await pool.query(
    `INSERT INTO contact_messages (id, name, email, subject, message) VALUES (:id, :name, :email, :subject, :message)`,
    { id, name, email, subject: subject || null, message },
  );
  void sendContactAckEmail(email, name);
  void sendContactNotifyEmail({ name, email, subject, message });
  res.status(201).json({ ok: true, message: 'Mesajınız kaydedildi. En kısa sürede dönüş yapılacak.' });
});

app.get('/api/admin/contact', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  const [rows] = await pool.query(
    `SELECT id, name, email, subject, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200`,
  );
  res.json(rows.map((r) => ({ ...r, is_read: !!r.is_read })));
});

app.patch('/api/admin/contact/:id/read', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/contact/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---- Admin ----
app.get('/api/admin/users', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  const [rows] = await pool.query(
    `SELECT id, email, role, full_name, company_name, phone, city, vergi_numarasi, dogrulama_durumu, dogrulama_talebi_tarihi, dogrulanma_tarihi, created_at
     FROM users ORDER BY created_at DESC LIMIT 500`,
  );
  res.json(rows);
});

app.patch('/api/admin/users/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  const { dogrulama_durumu, role } = req.body || {};
  if (dogrulama_durumu) {
    if (dogrulama_durumu === 'verified') {
      await pool.query(
        `UPDATE users SET dogrulama_durumu = :d, dogrulanma_tarihi = NOW() WHERE id = :id`,
        { d: dogrulama_durumu, id: req.params.id },
      );
      const [urows] = await pool.query('SELECT email, company_name, full_name FROM users WHERE id = ?', [
        req.params.id,
      ]);
      const u = urows[0];
      if (u) {
        const notifId = uid();
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, body, link, \`read\`)
           VALUES (?, ?, ?, ?, ?, 0)`,
          [
            notifId,
            req.params.id,
            'Hesabınız onaylandı',
            'İşveren hesabınız doğrulandı. Artık ilan yayınlayabilirsiniz.',
            '/ilan-ekle',
          ],
        );
        void sendEmployerVerifiedEmail(u.email, u.company_name || u.full_name);
      }
    } else {
      await pool.query(`UPDATE users SET dogrulama_durumu = :d WHERE id = :id`, {
        d: dogrulama_durumu,
        id: req.params.id,
      });
    }
  }
  if (role) {
    await pool.query(`UPDATE users SET role = :role WHERE id = :id`, { role, id: req.params.id });
  }
  res.json({ ok: true });
});

app.post('/api/admin/repair-images', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  const [jobs] = await pool.query('SELECT id, title, image_url FROM jobs WHERE image_url IS NOT NULL');
  const before = jobs.map((j) => ({ id: j.id, title: j.title, image_url: j.image_url }));
  await sanitizeJobImages(jobs);
  const clearedJobs = before.filter((b) => {
    const after = jobs.find((j) => j.id === b.id);
    return after && after.image_url === null && b.image_url;
  });
  res.json({
    ok: true,
    checked: jobs.length,
    cleared: clearedJobs.length,
    cleared_ids: clearedJobs.map((j) => j.id),
    note:
      clearedJobs.length > 0
        ? `${clearedJobs.length} kırık görsel temizlendi.`
        : 'Kırık görsel bulunamadı.',
  });
});

app.delete('/api/jobs/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yalnızca admin silebilir' });
  const [found] = await pool.query('SELECT id FROM jobs WHERE id = ? OR slug = ? LIMIT 1', [
    req.params.id,
    req.params.id,
  ]);
  const jobId = found[0]?.id;
  if (!jobId) return res.status(404).json({ error: 'İlan yok' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM applications WHERE job_id = ?', [jobId]);
    await conn.query('DELETE FROM favorites WHERE job_id = ?', [jobId]);
    const [r] = await conn.query('DELETE FROM jobs WHERE id = ?', [jobId]);
    await conn.commit();
    if (!r.affectedRows) return res.status(404).json({ error: 'İlan yok' });
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: e.message });
  } finally {
    conn.release();
  }
});

app.get('/api/admin/stats', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin' });
  const [[j]] = await pool.query(`SELECT COUNT(*) c FROM jobs`);
  const [[a]] = await pool.query(`SELECT COUNT(*) c FROM applications`);
  const [[e]] = await pool.query(`SELECT COUNT(*) c FROM users WHERE role = 'employer'`);
  const [[c]] = await pool.query(`SELECT COUNT(*) c FROM users WHERE role = 'candidate'`);
  res.json({
    jobs: j.c,
    applications: a.c,
    employers: e.c,
    candidates: c.c,
    mail: isMailReady(),
    google: Boolean(GOOGLE_CLIENT_ID),
  });
});

app.post('/api/jobs/expire', async (req, res) => {
  const secret = req.headers['x-cron-secret'] || req.body?.secret;
  if (process.env.CRON_SECRET) {
    if (secret !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Yetkisiz' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'CRON_SECRET tanımlı değil' });
  }
  const [r] = await pool.query(
    `UPDATE jobs SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()`,
  );
  res.json({ updated: r.affectedRows || 0 });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on :${PORT} mail=${isMailReady()} google=${Boolean(GOOGLE_CLIENT_ID)}`);
    });
  })
  .catch((e) => {
    console.error('FATAL: schema hazırlanamadı', e.message);
    process.exit(1);
  });
