# Railway Deploy — İzmir İş İlanları 35

## 0) Önkoşul
- Supabase URL + anon key hazır olsun (yoksa site açılır ama auth/DB çalışmaz).
- Bu klasörde `Dockerfile` + `railway.toml` hazır.

## 1) Giriş (kendi PowerShell / CMD pencerenizde)

```powershell
cd "C:\Users\Teknogenetik\Downloads\İzmirişilanları35"
railway login
```

Tarayıcı açılır → Railway hesabınla onayla.

Bitince bana yaz: **“giriş yaptım”** — kalan adımları birlikte koştururuz.

## 2) Proje oluştur + bağla

```powershell
railway init
```

İsim önerisi: `izmir-is-ilanlari-35`

## 3) Ortam değişkenleri (build için zorunlu)

```powershell
railway variables set VITE_PUBLIC_SUPABASE_URL="https://XXXX.supabase.co"
railway variables set VITE_PUBLIC_SUPABASE_ANON_KEY="eyJ...."
```

`XXXX` ve key = kendi Supabase değerlerin.

## 4) Deploy

```powershell
railway up
```

## 5) Domain

```powershell
railway domain
```

veya Dashboard → Settings → Networking → Generate Domain

---

**Not:** Vite env’leri **build anında** gömülür. Key değişirse yeniden `railway up` gerekir.
