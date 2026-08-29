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

## 4) Alan adları (Railway)

### A) `izmirisilanlari35.com` (asıl site)

Railway Dashboard → Service → **Settings → Networking → Custom Domain**:

1. `izmirisilanlari35.com` ekle  
2. `www.izmirisilanlari35.com` ekle  
3. Railway’in verdiği **CNAME / DNS** kayıtlarını domain sağlayıcında oluştur  

Tipik DNS (Railway ekranındaki değerleri kullan; örnek):

| Tip   | Host | Değer                          |
|-------|------|--------------------------------|
| CNAME | www  | `xxxx.up.railway.app`          |
| ALIAS/ANAME veya CNAME düzeltmesi | @ | Railway’in gösterdiği hedef |

TLS sertifikasını Railway otomatik verir (DNS yayılınca, birkaç dakika–saat).

### B) `izmirisilanlari35.wordpress.com`

Bu adres **WordPress.com’un alt alanı**; DNS’i Railway’e bağlanamaz.  
Railway’e custom domain olarak **eklenemez**.

Yapılacak: WordPress.com panelinde siteyi  
`https://izmirisilanlari35.com` adresine **yönlendir** (Site Redirect / yönlendirme).  
Ücretsiz planda kısıtlı olabilir; yoksa WordPress ana sayfasına tek satırlık yönlendirme koy:

Eski WordPress ziyaretçileri → asıl site (Railway).

`izmirisilanlari35.com` daha önce WordPress’e bağlıysa: WordPress’ten custom domain’i **kaldır**, DNS’i yukarıdaki gibi Railway’e çevir.

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
