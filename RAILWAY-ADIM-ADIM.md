# Railway Kurulum — Sıfırdan Adım Adım

Bu rehber: **MySQL (boş)** + **API** + **Web sitesi** bağlantısı.  
Kod GitHub'da hazır: `umutturkyilmaz/izmirisilanlar-35`

---

## Büyük resim (3 parça)

```
[ Ziyaretçi ] → izmirisilanlari35.com (WEB)
                      ↓ API istekleri
              xxx-api.up.railway.app (API / server klasörü)
                      ↓ veri
              MySQL (tablolar)
```

Tarayıcı **MySQL'e dokunmaz**. Sadece API konuşur.

---

## ADIM 0 — Giriş

1. Tarayıcıda aç: https://railway.com  
2. Giriş yap (GitHub ile olabilir).  
3. Projeni seç (İzmir iş ilanları projesi).

Solda **3 şey** görmelisin (isimler farklı olabilir):
- **MySQL** (veritabanı)
- **Web** servisi (site — repo kökü)
- **API** servisi (yoksa ADIM 4'te ekleyeceğiz)

---

## ADIM 1 — MySQL boş mu? (Tabloları kur)

Yeni MySQL = **boş**. Eski veri gitti; `schema.sql` tekrar çalışmalı.

### 1a) schema dosyasını aç (bilgisayarında)

Dosya yolu:
```
İzmirişilanları35/server/schema.sql
```
**Tümünü** kopyala (Ctrl+A, Ctrl+C).

### 1b) Railway'de SQL çalıştır

**Yol A — Railway Query (varsa):**
1. Solda **MySQL** servisine tıkla  
2. **Data** veya **Query** sekmesi  
3. Yapıştır → **Run** / **Execute**

**Yol B — Bağlantı bilgisi ile (Query yoksa):**
1. MySQL servisi → **Connect** veya **Variables**  
2. Şunları not al: `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`  
3. [TablePlus](https://tableplus.com) veya [DBeaver](https://dbeaver.io) kur  
4. Yeni MySQL bağlantısı → bilgileri gir → `schema.sql` içeriğini çalıştır

### 1c) Başarı kontrolü

Tablolardan biri görünmeli: `users`, `jobs`, `job_categories` …

---

## ADIM 2 — API servisi var mı?

### Yoksa — yeni API servisi

1. Proje sayfasında **+ New** → **GitHub Repo**  
2. Repo: `izmirisilanlar-35` (veya `umutturkyilmaz/izmirisilanlar-35`)  
3. Servis oluşunca → **Settings**  
4. **Root Directory** = `server` (önemli!)  
5. **Save** → otomatik deploy başlar

### Varsa — kontrol

1. API servisi → **Settings** → Root Directory = `server` olmalı  
2. Değilse `server` yaz → Save

---

## ADIM 3 — API'yi MySQL'e bağla (Variables)

1. **API** servisine tıkla (MySQL değil!)  
2. **Variables** sekmesi  
3. **+ New Variable** veya **Add Reference**

### MySQL referansları (önerilen)

**+ Add Reference** → MySQL servisini seç → şunları ekle:

| Değişken | Kaynak |
|----------|--------|
| `MYSQLHOST` | MySQL'den |
| `MYSQLUSER` | MySQL'den |
| `MYSQLPASSWORD` | MySQL'den |
| `MYSQLDATABASE` | MySQL'den |
| `MYSQLPORT` | MySQL'den |

*(Railway bazen `DATABASE_URL` verir; API ikisini de okur.)*

### Elle eklenecek zorunlu değişkenler

| Değişken | Ne yazacaksın |
|----------|----------------|
| `JWT_SECRET` | Uzun rastgele metin (ör: `izmir35-gizli-2026-xK9mP2qR7vN4`) |
| `NODE_ENV` | `production` |
| `PUBLIC_SITE_URL` | `https://izmirisilanlari35.com` |

`PUBLIC_API_URL` → **ADIM 4'ten sonra** eklenecek (domain henüz yok).

4. **Deploy** tetiklenir; **Deployments** → son satır **Success** olana kadar bekle.

---

## ADIM 4 — API'ye internet adresi (domain)

1. API servisi → **Settings** → **Networking**  
2. **Generate Domain**  
3. Çıkan adresi kopyala, örnek:  
   `https://izmir-api-production-xxxx.up.railway.app`

4. **Variables**'a geri dön → ekle:
   ```
   PUBLIC_API_URL=https://izmir-api-production-xxxx.up.railway.app
   ```
   (sonunda `/` olmasın)

5. Tekrar deploy bitsin.

### API sağlık testi

Tarayıcıda aç:
```
https://SENIN-API-DOMAIN.up.railway.app/api/health
```

Görmek istediğin:
```json
{"ok":true,"db":true}
```

`db:false` → MySQL bağlantısı yanlış (ADIM 3'ü tekrarla).

---

## ADIM 5 — Web sitesini API'ye bağla

1. Solda **Web** servisine tıkla (repo kökü, `server` değil!)  
2. **Variables**:

```
VITE_PUBLIC_API_URL=https://SENIN-API-DOMAIN.up.railway.app
VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
```

3. **Deployments** → **Redeploy** (veya Deploy Now)

> `VITE_` değişkenleri **build sırasında** gömülür. Değiştirdikten sonra mutlaka redeploy.

---

## ADIM 6 — Siteyi test et

1. Web domain: Railway **Networking** → web servisinin `*.up.railway.app` adresi  
   veya `https://izmirisilanlari35.com`

2. Sırayla dene:
   - Ana sayfa açılıyor mu?
   - `/kayit` → hesap oluştur
   - `/giris` → giriş yap
   - Üstte sarı “API eksik” bandı **olmamalı**

3. Hâlâ API bandı varsa → `VITE_PUBLIC_API_URL` yanlış veya redeploy yapılmadı.

---

## ADIM 7 — İlk admin

1. Siteden normal kayıt ol (e-postanı kullan)  
2. Railway → **MySQL** → Query  
3. Çalıştır (`senin@email.com` değiştir):

```sql
UPDATE users SET role = 'admin' WHERE email = 'senin@email.com';
```

4. Çıkış yap → tekrar giriş → `/admin` açılmalı

---

## ADIM 8 — Özel domain (izmirisilanlari35.com)

Web servisi → **Settings** → **Networking** → **Custom Domain**  
`izmirisilanlari35.com` ekle → Railway'in verdiği CNAME'yi Cloudflare'e yaz.

Cloudflare: turuncu bulut (Proxied) + SSL **Full**.

---

## Sık hatalar

| Belirti | Çözüm |
|---------|--------|
| Beyaz sayfa | Web deploy loglarına bak; build hatası |
| API bandı | `VITE_PUBLIC_API_URL` + redeploy |
| `db:false` | API Variables'da MySQL referansları |
| Giriş çalışmıyor | `schema.sql` çalıştırıldı mı? |
| 502 API | API deploy failed → Logs |

---

## İsteğe bağlı — Upload kalıcılığı

API servisi → **Volumes** → Add Volume  
Mount: `/data/uploads`  
Variable: `UPLOAD_DIR=/data/uploads`

Yoksa yüklenen görseller redeploy'da silinir.

---

## Özet checklist

- [ ] MySQL'de `schema.sql` çalıştı  
- [ ] API servisi Root = `server`  
- [ ] API: MySQL refs + `JWT_SECRET` + `PUBLIC_API_URL`  
- [ ] `/api/health` → `db:true`  
- [ ] Web: `VITE_PUBLIC_API_URL` + redeploy  
- [ ] Kayıt / giriş test  
- [ ] Admin SQL

Tamamlayınca site ↔ API ↔ MySQL bağlıdır.
