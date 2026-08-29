# Railway Deploy — İzmir İş İlanları 35

Hosting: **yalnızca Railway** (Docker yok — Nixpacks + Node).

## Variables
- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com`

## Build / Start (otomatik)
- Build: `npm ci && npm run build`
- Start: `npm run start` → `out/` klasörünü servis eder

## Railway panel
1. Settings → Build: **Nixpacks** (Dockerfile seçiliyse kaldır)
2. Root directory: boş
3. Deploy Success → `*.up.railway.app` açılmalı

## Domain
WordPress’ten domain’i ayır → Railway CNAME + `_railway-verify` TXT  
Detay için Networking → Configure DNS
