-- Migration: Add analysis metadata columns to the news table
-- Required by the downstream AI analysis + BIST trading bot.
--
-- Run once in your Supabase SQL editor or via supabase db push.
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure the base table exists (safe no-op if already created)
CREATE TABLE IF NOT EXISTS news (
    id           BIGSERIAL PRIMARY KEY,
    source       TEXT,
    title        TEXT NOT NULL,
    content      TEXT,
    url          TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    source_weight FLOAT DEFAULT 0.1,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── New columns for event classification ─────────────────────────────────────

-- Event category: central_bank | commodity | energy | geopolitical | macro |
--                 disaster | pandemic | political | security | crypto |
--                 turkish_market | general
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Granular event type within category (e.g. rate_hike, earthquake, whale_transaction)
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'news';

-- Top-15 keywords extracted from title+content — used for historical similarity search
ALTER TABLE news ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Assets directly mentioned: BIST | USD/TRY | EUR/TRY | oil | gold | BTC | bonds | banks
ALTER TABLE news ADD COLUMN IF NOT EXISTS affected_assets TEXT[] DEFAULT '{}';

-- Structured numerical payload (prices, magnitudes, crypto amounts, tweet metadata)
ALTER TABLE news ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT NULL;

-- 0.0–1.0 computed priority score (source_weight + high-impact keyword bonus)
ALTER TABLE news ADD COLUMN IF NOT EXISTS importance_score FLOAT DEFAULT 0.1;

-- Article language: 'tr' or 'en'
ALTER TABLE news ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- ── Performance indexes for the analysis bot ─────────────────────────────────

-- Most common query pattern: "find all events of category X in date range"
CREATE INDEX IF NOT EXISTS idx_news_category        ON news (category);
CREATE INDEX IF NOT EXISTS idx_news_event_type      ON news (event_type);
CREATE INDEX IF NOT EXISTS idx_news_importance      ON news (importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_at    ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_language        ON news (language);

-- GIN index enables: WHERE 'BIST' = ANY(affected_assets)
CREATE INDEX IF NOT EXISTS idx_news_affected_assets ON news USING GIN (affected_assets);
CREATE INDEX IF NOT EXISTS idx_news_keywords        ON news USING GIN (keywords);

-- Deduplication constraint on URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_url_unique ON news (url) WHERE url IS NOT NULL AND url <> '';
