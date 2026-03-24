# NEWS FEEDER BOT

Finansal ve ekonomik haberleri 13 farklı kaynaktan saatlik olarak toplayıp normalize ederek Supabase'e kaydeden bir haber besleme botu. Downstream analiz botu (BIST trading sinyali) bu verileri "geçmişte benzer olaylar neler oldu, piyasalar nasıl etkilendi" sorusunu cevaplamak için kullanır.

## Kurulum

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env
```

`.env` dosyasını düzenle:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key

TWITTER_BEARER_TOKEN=your-twitter-bearer-token
WHALE_ALERT_API_KEY=your-whale-alert-api-key
OIL_PRICE_API_KEY=your-oil-price-api-key   # opsiyonel
```

### 3. Supabase Migration'ı Çalıştır
Supabase SQL Editor'da şunu çalıştır:
```
supabase/migrations/001_add_analysis_fields.sql
```

### 4. Botu Başlat
```bash
npm start
```

Bot başladığında hemen bir tur çeker, sonra her saat başı tekrar çalışır.

---

## Veri Kaynakları

| Kategori | Kaynaklar | Source Weight |
|---|---|---|
| **Türk Piyasası** | KAP, Bloomberg HT, Anadolu Ajansı | 0.20–0.35 |
| **Merkez Bankaları** | TCMB, Fed, ECB, BoE, BoJ | 0.25–0.55 |
| **Jeopolitik** | Reuters, BBC, AP, Al Jazeera | 0.20–0.30 |
| **Makro Ekonomi** | Trading Economics, Investing.com, MarketWatch | 0.20–0.30 |
| **Enerji** | OPEC, EIA, Oil Price + OilPriceAPI | 0.25–0.40 |
| **Emtia** | Kitco, Mining.com + Metals.Live API | 0.15–0.30 |
| **Doğal Afetler** | USGS, EMSC, NOAA | 0.20–0.50 |
| **Sağlık/Pandemi** | WHO, CDC, Reuters Health | 0.20–0.40 |
| **Siyasi** | Reuters, BBC, Guardian, CNN | 0.15–0.30 |
| **Güvenlik** | Reuters, BBC, AP, CNN, Guardian | 0.15–0.30 |
| **Twitter/X** | Borsa İstanbul, TCMB, TRY ilgili tweetler | 0.10 |
| **Kripto Whale** | Whale Alert API (≥$1M işlemler) | 0.15 |

---

## Veritabanı (Supabase `news` Tablosu)

| Sütun | Tip | Açıklama |
|---|---|---|
| `id` | BIGSERIAL | Primary key |
| `source` | TEXT | Kaynak adı |
| `title` | TEXT | Başlık |
| `content` | TEXT | İçerik özeti |
| `url` | TEXT | Orijinal URL (unique) |
| `published_at` | TIMESTAMPTZ | Yayın tarihi |
| `source_weight` | FLOAT | Kaynağın güvenilirlik ağırlığı (0–1) |
| `category` | TEXT | `central_bank`, `energy`, `geopolitical`, `macro`, `disaster`, `pandemic`, `political`, `security`, `crypto`, `turkish_market`, `commodity`, `general` |
| `event_type` | TEXT | `rate_hike`, `rate_cut`, `earthquake`, `election`, `whale_transaction`, `price_update` ... |
| `keywords` | TEXT[] | Başlık+içerikten çıkarılan anahtar kelimeler |
| `affected_assets` | TEXT[] | `BIST`, `USD/TRY`, `oil`, `gold`, `BTC`, `bonds`... |
| `importance_score` | FLOAT | 0.0–1.0 etki skoru |
| `raw_data` | JSONB | Ham sayısal veri (deprem büyüklüğü, ham fiyat, tweet metadata) |
| `language` | TEXT | `tr` / `en` |

---

## Örnek Sorgular (Analiz Botu İçin)

```sql
-- Son 2 yılda BIST'i etkileyen faiz kararları
SELECT title, source, event_type, importance_score, published_at
FROM news
WHERE category = 'central_bank'
  AND event_type IN ('rate_hike', 'rate_cut')
  AND 'BIST' = ANY(affected_assets)
ORDER BY published_at DESC;

-- Yüksek önem skorlu jeopolitik olaylar
SELECT * FROM news
WHERE category = 'geopolitical' AND importance_score >= 0.6
ORDER BY importance_score DESC, published_at DESC;

-- Belirli bir keyword içeren haberler
SELECT * FROM news
WHERE keywords @> ARRAY['deprem']
ORDER BY published_at DESC;
```
