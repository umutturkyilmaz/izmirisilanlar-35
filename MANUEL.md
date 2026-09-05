# MySQL + API (Supabase / PocketBase yok)

## Mimari
1. **MySQL** (Railway plugin) — veri
2. **API** (`server/`) — Express, auth, upload
3. **Web** (mevcut Vite) — `VITE_PUBLIC_API_URL`

Tarayıcı MySQL’e doğrudan bağlanmaz.

## Railway kurulum (test)
1. PocketBase / Supabase şablon servislerini **sil**
2. Project → **New** → **Database** → **MySQL**
3. New service → GitHub repo aynı → **Root Directory: `server`**
   - Start: `npm start`
   - Variables: MySQL’den referansla `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`
     veya tek `DATABASE_URL`
   - `JWT_SECRET` = uzun rastgele metin
   - `PUBLIC_API_URL` = API’nin public domain’i (Generate Domain sonrası)
4. MySQL’e `server/schema.sql` çalıştır (Query / TablePlus / mysql client)
5. API → Networking → **Generate Domain** → örn. `https://xxx.up.railway.app`
6. **izmirisilanlar-35** (web) Variables:
   ```
   VITE_PUBLIC_API_URL=https://xxx.up.railway.app
   VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
   ```
7. Web **Redeploy**

## İlk admin
Kayıt ol (employer veya candidate) → MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'senin@email.com';
```

## Kontrol
- `GET https://API/api/health` → `ok`, `db`, `mail`, `google`
- Sitede kayıt / giriş / ilan listesi

## E-posta (API Variables) — Gmail App Password

1. https://myaccount.google.com/security → **2 Adımlı Doğrulama** açık olsun  
2. https://myaccount.google.com/apppasswords → uygulama adı: `izmir-api` → **16 karakterlik şifre** kopyala (boşluksuz)  
3. Railway → **API servisi** → Variables → ekle:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=umutata355@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=İzmir İş İlanları 35 <umutata355@gmail.com>
CONTACT_NOTIFY_TO=umutata355@gmail.com
```

`SMTP_PASS` = App Password (normal Gmail şifresi değil).

## Google giriş

1. https://console.cloud.google.com/ → proje oluştur / seç  
2. **APIs & Services → OAuth consent screen** → External → uygulama adı: İzmir İş İlanları 35 → kaydet  
3. **Credentials → Create Credentials → OAuth client ID → Web application**  
   - Authorized JavaScript origins:
     - `https://izmirisilanlari35.com`
     - `http://localhost:5173`
   - Authorized redirect URIs: (boş bırakılabilir; GIS popup için origin yeterli)
4. Client ID’yi kopyala (ör. `123456789-xxx.apps.googleusercontent.com`)

Railway **API**:
```
GOOGLE_CLIENT_ID=SENIN_CLIENT_ID
```

Railway **Web** (Vite — redeploy gerekir):
```
VITE_GOOGLE_CLIENT_ID=SENIN_CLIENT_ID
```

Kontrol: `GET https://API/api/health` → `"mail":true,"google":true`  
Sitede `/giris` ve `/kayit` → Google butonu görünür.

## Sosyal (Web)
`VITE_SOCIAL_INSTAGRAM`, `VITE_SOCIAL_TWITTER`, `VITE_SOCIAL_LINKEDIN`

## Upload kalıcılığı (Railway)
API servisinde görseller MySQL’de saklanır (otomatik tablo). Volume artık zorunlu değil.
CV private: `/api/files/...` (auth).
Redeploy olmadan dosyalar korunur.

## Lokal geliştirme
```bash
# Terminal 1 — API
cd server && cp .env.example .env   # MySQL bilgilerini doldur
npm install && npm run dev

# Terminal 2 — Web (proxy ile /api → localhost:8080)
npm run dev
```
`.env` kökte opsiyonel; proxy kullanıyorsan `VITE_PUBLIC_API_URL` boş bırakılabilir.

## iyzico (senin vereceğin bilgiler)

Kod hazır. Anahtar yokken **test modu**: checkout → kredi anında (`mode: test`).

Anahtarları **yalnızca API** servisine ekle (Vite / web’e asla koyma):

```
IYZICO_ENABLED=true
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_SANDBOX=true
PUBLIC_API_URL=https://SENIN-API.up.railway.app
PUBLIC_SITE_URL=https://izmirisilanlari35.com
```

Canlıya geçince: `IYZICO_SANDBOX=false` (veya `IYZICO_BASE_URL=https://api.iyzipay.com`).

Akış: `/odeme` → API Checkout Form → iyzico → `POST /api/payments/iyzico/callback` → kredi → `/odeme/basarili`.

Kontrol: `GET /api/payments/iyzico/status` → `{"enabled":true,...}`

Merchant panel: sandbox-merchant.iyzipay.com / merchant.iyzipay.com — callback URL otomatik `PUBLIC_API_URL` ile üretilir.
