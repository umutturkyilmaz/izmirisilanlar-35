# Railway Deploy — İzmir İş İlanları 35

## 0) Önkoşul
- Hosting **yalnızca Railway** (başka yayın platformu yok).
- Supabase URL + anon key hazır olsun (auth/DB için; hosting değil).
- Bu klasörde `Dockerfile` + `railway.toml` hazır.

## 1) Giriş (kendi PowerShell pencerenizde)

```powershell
cd "C:\Users\Teknogenetik\Downloads\İzmirişilanları35"
railway login
railway link
```

## 2) Ortam değişkenleri

Railway Dashboard → Variables (veya CLI):

```powershell
railway variables set VITE_PUBLIC_SUPABASE_URL="https://XXXX.supabase.co"
railway variables set VITE_PUBLIC_SUPABASE_ANON_KEY="eyJ...."
railway variables set VITE_PUBLIC_SITE_URL="https://izmirisilanlari35.com"
```

Vite env’leri **build anında** gömülür. Değişince yeniden deploy gerekir.

## 3) Deploy

GitHub bağlıysa push yeterli. Manuel:

```powershell
railway up
```

## 4) Alan adları — DNS (senin panel + Railway)

`izmirisilanlari35.com` şu an **WordPress IP**’lerine gidiyor (`192.0.78.x`).  
Railway `oft9sx45.up.railway.app` için DNS henüz tamam değil; `_railway-verify` TXT yok.

### Adım 1 — WordPress’ten domain’i ayır
WordPress.com → Domains → `izmirisilanlari35.com` → **Disconnect / Remove**.  
Kayıtlardaki “WordPress.com tarafından işlendi” kalkmadan Railway CNAME yazılamaz.

### Adım 2 — DNS kayıtları (Railway’in istediği)
Registrar DNS panelinde:

| TÜR  | İSİM             | DEĞER                                      |
|------|------------------|--------------------------------------------|
| CNAME | `@`             | `oft9sx45.up.railway.app`                  |
| TXT   | `_railway-verify` | Railway’deki **tam** `railway-verify=...` (kopyala butonu) |
| CNAME | `www`           | `oft9sx45.up.railway.app`                  |

- Eski WordPress **A** kaydını sil veya CNAME `@` ile değiştir.  
- `@` için CNAME kabul etmeyen panelde Railway’in verdiği **ALIAS/ANAME** veya A kaydını kullan.  
- TXT sarı uyarı kalkana kadar bekle (5–30 dk, bazen 1–2 saat).

### Adım 3 — Önce Railway URL
Deploy yeşil olduktan sonra tarayıcıda dene:  
https://oft9sx45.up.railway.app  

Burada site açılmadan domain de açılmaz.

### Adım 4 — wordpress.com alt alan
`izmirisilanlari35.wordpress.com` → WordPress’te yönlendir → `https://izmirisilanlari35.com`  
(Railway’e custom domain olarak eklenemez.)


## 5) Supabase Auth URL’leri

Supabase → Authentication → URL Configuration:

- Site URL: `https://izmirisilanlari35.com`
- Redirect allow list:
  - `https://izmirisilanlari35.com/**`
  - `https://www.izmirisilanlari35.com/**`
  - `https://*.up.railway.app/**` (geçici Railway URL)

## 6) Kontrol

- https://izmirisilanlari35.com açılıyor mu  
- https://www.izmirisilanlari35.com → aynı site / yönlendirme  
- WordPress alt alan → .com’a gidiyor mu  
