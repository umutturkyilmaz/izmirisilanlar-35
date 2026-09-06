/**
 * Güvenlik yardımcıları — istemciye ham hata sızdırma, dosya sniff
 */

export function sniffFileMime(buf) {
  if (!buf || buf.length < 4) return null;
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  return null;
}

const MIME_TO_EXT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};

export function assertUploadContent(file) {
  const sniffed = sniffFileMime(file.buffer);
  if (!sniffed) {
    const err = new Error('Dosya içeriği tanınamadı veya desteklenmiyor');
    err.status = 400;
    throw err;
  }
  const ext = (file.originalname && file.originalname.includes('.')
    ? `.${file.originalname.split('.').pop().toLowerCase()}`
    : '') || '';
  const allowedExt = MIME_TO_EXT[sniffed] || [];
  if (ext && !allowedExt.includes(ext)) {
    const err = new Error('Dosya uzantısı içerikle uyuşmuyor');
    err.status = 400;
    throw err;
  }
  // client MIME sahteciliğine karşı sniff kazanır
  return sniffed;
}

/** İstemciye yalnızca bilerek işaretlenmiş veya 4xx iş kuralları mesajı; asla DB/stack sızdırma. */
export function publicError(err, fallback = 'İşlem başarısız') {
  if (err?.expose === true && typeof err.message === 'string' && err.message) {
    return err.message.slice(0, 200);
  }
  if (
    err?.status &&
    err.status >= 400 &&
    err.status < 500 &&
    typeof err.message === 'string' &&
    err.message &&
    !/sql|mysql|errno|econn|stack|at\s+\S+\s+\(/i.test(err.message)
  ) {
    return err.message.slice(0, 200);
  }
  return fallback;
}
