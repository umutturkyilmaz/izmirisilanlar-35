# Manuel kurulum — Supabase + Railway (iyzico hariç)

## Mimari (karıştırma)
- **Railway** = site (React). Supabase Railway’e “kurulmaz”.
- **Supabase** = auth + Postgres + storage (`*.supabase.co`).

---

## A) Benim hazırladığım (repoda hazır)
1. `supabase/full-setup.sql` — boş proje için **tek sefer** SQL (tablolar + RLS + storage + kategoriler)
2. Railway Variables isimleri aşağıda
3. Auth URL listesi aşağıda

## B) Senin yapman gereken (hesap sende)

### 1) Supabase proje
1. https://supabase.com → Sign in (umutata355 / site sahibi Gmail)
2. **New project** → isim: `izmir-is-ilanlari-35` → region: Frankfurt (veya yakın) → Create
3. Proje açılınca **SQL Editor** → New query  
4. Bilgisayardan aç:  
   `C:\Users\Teknogenetik\Downloads\İzmirişilanları35\supabase\full-setup.sql`  
   Tümünü kopyala → yapıştır → **Run** (Success olmalı)

### 2) API anahtarları
**Project Settings → API**
- Project URL → `VITE_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `VITE_PUBLIC_SUPABASE_ANON_KEY`

### 3) Auth URL
**Authentication → URL Configuration**
- Site URL: `https://izmirisilanlari35.com`
- Redirect URLs ekle:
  - `https://izmirisilanlari35.com/**`
  - `https://www.izmirisilanlari35.com/**`
  - `http://localhost:3000/**`

### 4) Railway Variables + Redeploy
Service → **Variables** → ekle (Suggested’daki placeholder’ı kullanma):

```
VITE_PUBLIC_SUPABASE_URL=https://XXXX.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJ....
VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
```

Sonra **Redeploy** (Vite build’de gömülür; değişince yeniden deploy şart).

### 5) Admin (ilk kullanıcıdan sonra)
SQL Editor:

```sql
update public.profiles
set role = 'admin'
where id = '<senin-user-uuid>';
```

UUID: Authentication → Users.

---

## Kontrol
1. https://izmirisilanlari35.com açılıyor  
2. Kayıt ol → giriş  
3. Ana sayfa / ilanlar boş liste (DB bağlı, veri yok) — hata yok  
4. İletişim formu kayıt düşüyor (`contact_messages`)

## Ertelediğimiz
- iyzico ödeme  
- Google OAuth (isteğe bağlı)  
- Gerçek e-posta gönderimi
