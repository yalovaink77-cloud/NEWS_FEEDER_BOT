-- Migration 002: Signal quality + backtest outcome columns
-- Run once in Supabase SQL Editor after 001_add_analysis_fields.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Signal quality columns (produced by normalizer) ──────────────────────────

-- Market direction inferred from headline: bullish | bearish | neutral
ALTER TABLE news ADD COLUMN IF NOT EXISTS signal_direction TEXT DEFAULT 'neutral';
ALTER TABLE news ADD CONSTRAINT chk_signal_direction
    CHECK (signal_direction IN ('bullish', 'bearish', 'neutral'))
    NOT VALID;  -- NOT VALID = skip scan of existing rows, only enforce on new inserts

-- Source-weighted + context-adjusted confidence in the signal (0.0–1.0)
ALTER TABLE news ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.1;

-- ── Backtest / outcome columns (filled by ALPET bot after market close) ──────

-- BIST-100 (or relevant asset) return N hours after news publication.
-- Positive = market went up, negative = market went down.
-- NULL = outcome not yet recorded or market closed at that time.
ALTER TABLE news ADD COLUMN IF NOT EXISTS outcome_1h  FLOAT DEFAULT NULL;
ALTER TABLE news ADD COLUMN IF NOT EXISTS outcome_4h  FLOAT DEFAULT NULL;
ALTER TABLE news ADD COLUMN IF NOT EXISTS outcome_1d  FLOAT DEFAULT NULL;

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_news_signal_direction ON news (signal_direction);
CREATE INDEX IF NOT EXISTS idx_news_confidence       ON news (confidence_score DESC);

-- Composite: the analysis bot's most frequent lookup pattern
CREATE INDEX IF NOT EXISTS idx_news_category_direction
    ON news (category, signal_direction, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_news_outcome_labeled
    ON news (outcome_1h, outcome_4h, outcome_1d)
    WHERE outcome_1h IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- ALPET BOT OUTCOME LABELING — run nightly (e.g. via pg_cron or external job)
-- ─────────────────────────────────────────────────────────────────────────────
-- The queries below are reference templates.  Replace :bist_1h_return etc. with
-- actual BIST-100 returns fetched from your price data source.
-- ─────────────────────────────────────────────────────────────────────────────

-- Example: label all high-confidence events from the last 24 h whose 1 h outcome
-- is still NULL (fill from your price feed before calling this):
--
-- UPDATE news
-- SET outcome_1h = :bist_return_1h
-- WHERE published_at BETWEEN NOW() - INTERVAL '25 hours' AND NOW() - INTERVAL '1 hour'
--   AND outcome_1h IS NULL
--   AND confidence_score >= 0.40
--   AND 'BIST' = ANY(affected_assets);

-- ─────────────────────────────────────────────────────────────────────────────
-- BACKTEST ANALYTICS QUERIES
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Hit-rate per event_type + signal_direction (min 10 sample size)
-- SELECT event_type,
--        signal_direction,
--        COUNT(*)                                        AS samples,
--        ROUND(AVG(outcome_1h)::numeric, 4)              AS avg_return_1h,
--        ROUND(AVG(outcome_4h)::numeric, 4)              AS avg_return_4h,
--        ROUND(AVG(outcome_1d)::numeric, 4)              AS avg_return_1d,
--        ROUND(100.0 * SUM(CASE
--            WHEN signal_direction = 'bullish' AND outcome_1h > 0 THEN 1
--            WHEN signal_direction = 'bearish' AND outcome_1h < 0 THEN 1
--            ELSE 0 END) / COUNT(*), 1)                  AS hit_rate_pct
-- FROM news
-- WHERE outcome_1h IS NOT NULL
-- GROUP BY event_type, signal_direction
-- HAVING COUNT(*) >= 10
-- ORDER BY hit_rate_pct DESC;


-- 2. Best-performing source × category combos
-- SELECT source, category, signal_direction,
--        COUNT(*)                            AS samples,
--        ROUND(AVG(outcome_1h)::numeric, 4)  AS avg_1h,
--        ROUND(AVG(confidence_score)::numeric, 3) AS avg_confidence
-- FROM news
-- WHERE outcome_1h IS NOT NULL
--   AND confidence_score >= 0.40
-- GROUP BY source, category, signal_direction
-- HAVING COUNT(*) >= 5
-- ORDER BY avg_1h DESC;


-- 3. Worst-performing signals to blacklist (expected value < -0.2 %)
-- SELECT event_type, signal_direction, COUNT(*) AS samples,
--        ROUND(AVG(outcome_1h)::numeric, 4) AS avg_1h
-- FROM news
-- WHERE outcome_1h IS NOT NULL
-- GROUP BY event_type, signal_direction
-- HAVING COUNT(*) >= 10 AND AVG(outcome_1h) < -0.002
-- ORDER BY avg_1h ASC;
