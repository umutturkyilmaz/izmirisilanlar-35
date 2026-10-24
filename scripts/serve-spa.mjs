/**
 * SPA static server: missing /assets (ve diğer statik uzantılar) → gerçek 404,
 * diğer yollar → index.html. Böylece eski hash’li chunk HTML dönüp fetch patlamaz.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'out');
const port = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const STATIC_EXT =
  /\.(js|mjs|css|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot|json|txt|webmanifest)$/i;

const SITE = 'https://izmirisilanlari35.com';
const API_BASE = (
  process.env.PUBLIC_API_URL ||
  process.env.VITE_PUBLIC_API_URL ||
  'https://izmirisilanlari35api-production.up.railway.app'
).replace(/\/$/, '');
const JOB_CACHE_MS = 10 * 60 * 1000;
const jobCache = new Map();

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const JOB_MISS_CACHE_MS = 30 * 1000;

async function fetchJob(key) {
  const hit = jobCache.get(key);
  if (hit && Date.now() - hit.at < (hit.job ? JOB_CACHE_MS : JOB_MISS_CACHE_MS)) return hit.job;
  let job = null;
  try {
    const r = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (r.ok) job = await r.json();
  } catch {
    /* API yavaş/erişilemez: genel meta ile devam */
  }
  jobCache.set(key, { job, at: Date.now() });
  if (jobCache.size > 500) jobCache.delete(jobCache.keys().next().value);
  return job;
}

/** Paylaşım botları (WhatsApp, Facebook, X, Google) JS çalıştırmadan ilan başlığını görsün */
function injectJobMeta(html, job, pathname) {
  const plain = String(job.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const where = [job.company_name, job.city].filter(Boolean).join(' · ');
  const title = `${job.title}${where ? ` — ${where}` : ''} | İzmir İş İlanları 35`;
  const desc = (plain || `${job.title} iş ilanı. Hemen başvurun.`).slice(0, 180);
  const url = `${SITE}${pathname}`;
  const image = /^https?:\/\//.test(job.image_url || '') ? job.image_url : `${SITE}/assets/og-image.jpg`;
  const set = (pattern, replacement) => {
    html = pattern.test(html) ? html.replace(pattern, replacement) : html;
  };
  set(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  set(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escapeHtml(desc)}" />`);
  set(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  set(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  set(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(desc)}" />`);
  set(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  set(/<meta property="og:type" content="[^"]*"\s*\/?>/, '<meta property="og:type" content="article" />');
  set(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  set(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  set(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(desc)}" />`);
  set(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  if (image !== `${SITE}/assets/og-image.jpg`) {
    html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*"\s*\/?>/g, '');
  }
  return html;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0].split('#')[0]);
  const cleaned = path.posix.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(root, cleaned);
  if (!full.startsWith(root)) return null;
  return full;
}

function existingFile(fp) {
  try {
    const st = fs.statSync(fp);
    if (st.isFile()) return fp;
    if (st.isDirectory()) {
      const idx = path.join(fp, 'index.html');
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  } catch {
    /* miss */
  }
  return null;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  // www → apex (Railway + Cloudflare)
  const host = String(req.headers.host || '').toLowerCase().split(':')[0];
  if (host === 'www.izmirisilanlari35.com') {
    const target = `https://izmirisilanlari35.com${req.url || '/'}`;
    res.writeHead(301, { Location: target, 'Cache-Control': 'public, max-age=3600' });
    return res.end();
  }

  const urlPath = req.url || '/';
  const pathname = urlPath.split('?')[0];

  // İlan sitemap'i API'de üretilir; Search Console aynı alan adını istediği için buradan sunulur
  if (pathname === '/sitemap-jobs.xml') {
    fetch(`${API_BASE}/sitemap-jobs.xml`, { signal: AbortSignal.timeout(5000) })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const xml = await r.text();
        send(res, 200, req.method === 'HEAD' ? '' : xml, {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        });
      })
      .catch(() =>
        send(res, 502, 'Sitemap geçici olarak alınamadı', {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        }),
      );
    return;
  }
  const isAssetPath = pathname.includes('/assets/') || STATIC_EXT.test(pathname);

  let resolved = existingFile(safePath(pathname === '/' ? '/index.html' : pathname));

  if (!resolved) {
    if (isAssetPath) {
      return send(res, 404, 'Not Found', {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });
    }
    resolved = path.join(root, 'index.html');
  }

  const ext = path.extname(resolved).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const isHtml = ext === '.html';
  const hashed = pathname.includes('/assets/');

  fs.readFile(resolved, async (err, data) => {
    if (!err && isHtml) {
      const m = pathname.match(/^\/ilan\/([^/]+)\/?$/);
      let key = null;
      try {
        key = m ? decodeURIComponent(m[1]) : null;
      } catch {
        key = null;
      }
      if (key) {
        const job = await fetchJob(key);
        if (job?.title) data = Buffer.from(injectJobMeta(data.toString('utf8'), job, pathname), 'utf8');
      }
    }
    if (err) {
      if (isAssetPath) {
        return send(res, 404, 'Not Found', {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
        });
      }
      return send(res, 500, 'Error', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    const headers = {
      'Content-Type': type,
      'Cache-Control': isHtml
        ? 'no-cache, no-store, must-revalidate'
        : hashed
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      'Content-Length': data.length,
    };
    if (req.method === 'HEAD') {
      res.writeHead(200, headers);
      return res.end();
    }
    send(res, 200, data, headers);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`SPA listening on 0.0.0.0:${port} root=${root}`);
});
