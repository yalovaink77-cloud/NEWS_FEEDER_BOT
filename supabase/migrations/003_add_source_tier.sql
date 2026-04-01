-- Migration 003: Source tier column + ALPET trade gate reference queries
-- Run after 002_add_signal_and_outcome_fields.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Source trustworthiness tier produced by normalizer.js detectSourceTier()
-- Values: tier_1 (official/primary) | tier_2 (established media) |
--         tier_3 (aggregator/scraper) | tier_4 (social media)
ALTER TABLE news ADD COLUMN IF NOT EXISTS source_tier TEXT DEFAULT 'tier_2';
ALTER TABLE news ADD CONSTRAINT chk_source_tier
    CHECK (source_tier IN ('tier_1', 'tier_2', 'tier_3', 'tier_4'))
    NOT VALID;

CREATE INDEX IF NOT EXISTS idx_news_source_tier ON news (source_tier);

-- Composite index for the ALPET trade gate query pattern:
-- "find recent high-confidence bullish/bearish signals from trusted sources"
CREATE INDEX IF NOT EXISTS idx_news_gate
    ON news (source_tier, signal_direction, confidence_score DESC, published_at DESC)
    WHERE signal_direction IN ('bullish', 'bearish');

-- ─────────────────────────────────────────────────────────────────────────────
-- ALPET TRADE GATE — reference query
-- Only open a position when ALL of these are true:
--   1. source_tier IN ('tier_1', 'tier_2')       → trusted source
--   2. confidence_score >= 0.45                   → clear signal
--   3. signal_direction IN ('bullish','bearish')  → direction known
--   4. importance_score >= 0.40                   → material impact
--   5. published_at > NOW() - INTERVAL '30 min'  → fresh (not stale)
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT *
-- FROM news
-- WHERE source_tier      IN ('tier_1', 'tier_2')
--   AND confidence_score >= 0.45
--   AND signal_direction IN ('bullish', 'bearish')
--   AND importance_score >= 0.40
--   AND published_at      > NOW() - INTERVAL '30 minutes'
-- ORDER BY confidence_score DESC, importance_score DESC
-- LIMIT 5;

-- ─────────────────────────────────────────────────────────────────────────────
-- TIER PERFORMANCE ANALYSIS — run after outcome_1h is populated
-- ─────────────────────────────────────────────────────────────────────────────
--
-- SELECT source_tier,
--        signal_direction,
--        COUNT(*)                                         AS samples,
--        ROUND(AVG(outcome_1h)::numeric, 4)               AS avg_return_1h,
--        ROUND(100.0 * SUM(CASE
--            WHEN signal_direction = 'bullish' AND outcome_1h > 0 THEN 1
--            WHEN signal_direction = 'bearish' AND outcome_1h < 0 THEN 1
--            ELSE 0 END) / COUNT(*), 1)                   AS hit_rate_pct
-- FROM news
-- WHERE outcome_1h IS NOT NULL
-- GROUP BY source_tier, signal_direction
-- HAVING COUNT(*) >= 10
-- ORDER BY source_tier, hit_rate_pct DESC;
