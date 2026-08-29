# İzmir İş İlanları 35 - Proje Planı

## Mimari

- Frontend: Railway (Dockerfile + nginx)
- DB/Auth/Storage: kendi Supabase Cloud (`*.supabase.co`)
- Ödeme: iyzico (manuel onay sonrası)

## Kodda hazır

- Paketler, ödeme UI (simülasyon), kredi + `job_payments`
- CV / avatar / ilan görseli upload
- KVKK / gizlilik / mesafeli satış / çerez bandı
- Admin: işveren, ilan, ödemeler, istatistik
- Route koruması, ilan süresi dolunca expire
- `supabase/schema.sql` (tek seferlik)

## Senin yapacakların

→ `MANUEL.md` dosyasına bak.

**Not:** `schema.sql` güncellendi (bildirimler + job update RLS). Daha önce çalıştırdıysan yeni kısımları tekrar uygula.
