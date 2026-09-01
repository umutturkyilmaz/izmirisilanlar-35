# Railway Deploy — İzmir İş İlanları 35

Hosting: **Railway** (Nixpacks + Node). İki servis: **Web** + **API** + **MySQL**.

## 1. Web servisi (repo kökü)
Variables:
```
VITE_PUBLIC_API_URL=https://SENIN-API.up.railway.app
VITE_PUBLIC_SITE_URL=https://izmirisilanlari35.com
```

Build: `npm ci && npm run build`  
Start: `npm run start` (static `out/`)

## 2. API servisi (Root Directory: `server`)
Variables: MySQL referansları + `JWT_SECRET` + `PUBLIC_API_URL` + `PUBLIC_SITE_URL`  
İsteğe bağlı: `UPLOAD_DIR=/data/uploads` (Volume mount), `CRON_SECRET`, iyzico anahtarları

Start: `npm start`  
Health: `GET /api/health`

## 3. MySQL
`server/schema.sql` dosyasını Query ile çalıştır.

## 4. Sıra
1. MySQL ekle → schema çalıştır  
2. API deploy → Generate Domain  
3. Web’e `VITE_PUBLIC_API_URL` yaz → Redeploy  

Detaylı kurulum: `MANUEL.md`
