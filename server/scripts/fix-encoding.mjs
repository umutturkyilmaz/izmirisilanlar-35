import fs from 'fs';

const path = 'src/index.js';
let s = fs.readFileSync(path);

// Try decode as utf8; if broken, work on string and rewrite as utf8
let text = s.toString('utf8');

const pairs = [
  [/publicError\(e, 'Giri[^']*'\)/g, "publicError(e, 'Giri\u015f ba\u015far\u0131s\u0131z')"],
  [/publicError\(e, '[^']*lem[^']*'\)/g, "publicError(e, '\u0130\u015flem ba\u015far\u0131s\u0131z')"],
  [/publicError\(e, '[^']*lan kaydedilemedi'\)/g, "publicError(e, '\u0130lan kaydedilemedi')"],
  [/publicError\(err, 'Y[^']*kleme hatas[^']*'\)/g, "publicError(err, 'Y\u00fckleme hatas\u0131')"],
  [/publicError\(e, 'Ge[^']*ersiz dosya'\)/g, "publicError(e, 'Ge\u00e7ersiz dosya')"],
  [/error: 'Admin rol[^']*'/g, "error: 'Admin rol\u00fc yaln\u0131zca veritaban\u0131ndan atanabilir'"],
  [
    /\/\/ Admin rol[^\n]*/g,
    '// Admin rolu API uzerinden verilemez (yalnizca candidate <-> employer)',
  ],
];

for (const [re, rep] of pairs) {
  text = text.replace(re, rep);
}

// Final Turkish for comment
text = text.replace(
  '// Admin rolu API uzerinden verilemez (yalnizca candidate <-> employer)',
  '// Admin rol\u00fc API \u00fczerinden verilemez (yaln\u0131zca candidate <-> employer)',
);

fs.writeFileSync(path, text, 'utf8');
console.log('ok', (text.match(/\uFFFD/g) || []).length);
console.log(text.includes('İşlem başarısız'), text.includes('İlan kaydedilemedi'));
