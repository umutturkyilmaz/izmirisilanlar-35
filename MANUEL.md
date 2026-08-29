# Senin yapman gerekenler (manuel)

Kod tarafı tamamlandı. Aşağıdakileri **sen** yapmalısın:

## 1) Supabase (zorunlu)

1. https://supabase.com adresinde yeni proje oluştur  
2. Project Settings → API → `Project URL` + `anon public` key kopyala  
3. Proje kökündeki `.env` dosyasını doldur:

```
VITE_PUBLIC_SUPABASE_URL="https://XXXX.supabase.co"
VITE_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

4. SQL Editor’da **tek sefer** çalıştır: `supabase/schema.sql`  
   (Daha önce çalıştırdıysan dosyanın sonundaki bildirim / job update bölümlerini de uygula.)  
5. (İsteğe bağlı) Auth → Providers → Google’ı aç  
6. Auth → URL Configuration → Site URL = canlı domain’in

## 2) Railway deploy (zorunlu yayın için)

1. Railway’de yeni proje → Dockerfile  
2. Build ARG / Variables:

- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`

3. Domain bağla  

## 3) iyzico (en son)

1. Site canlı + paketler görünür olmalı  
2. iyzico inceleme / onay  
3. Onay sonrası Checkout entegrasyonu yapılır (bilinçli olarak kodda bekletildi)

## 4) Admin hesabı

Supabase’de kendi kullanıcının `profiles.role` değerini `admin` yap.
