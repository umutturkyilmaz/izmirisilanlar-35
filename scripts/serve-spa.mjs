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

  const urlPath = req.url || '/';
  const pathname = urlPath.split('?')[0];
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

  fs.readFile(resolved, (err, data) => {
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
