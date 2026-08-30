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
- `GET https://API/api/health` → `{"ok":true,"db":true}`
- Sitede kayıt / giriş / ilan listesi

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
