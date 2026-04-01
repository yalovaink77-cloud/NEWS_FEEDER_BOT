// ---------------------------------------------------------------------------
// Asset keyword mapping — used by downstream analysis bot for filtering
// ---------------------------------------------------------------------------

// Bullish signals — events likely to push BIST / TRY upward
const BULLISH_KEYWORDS = [
    'rate cut', 'rate cuts', 'faiz indirim', 'faiz indirdi', 'faiz düşür',
    'growth', 'gdp growth', 'büyüme', 'trade surplus', 'current account surplus',
    'rally', 'recovery', 'rebound', 'yükseliş', 'toparlanma',
    'ceasefire', 'peace deal', 'ateşkes', 'barış anlaşması',
    'investment inflow', 'capital inflow', 'yatırım artışı',
    'inflation slows', 'inflation eases', 'enflasyon düştü', 'enflasyon yavaşladı',
    'beat expectations', 'better than expected', 'beklentilerin üzerinde',
    'deal signed', 'agreement reached', 'anlaşma sağlandı',
    'strong demand', 'güçlü talep', 'güçlü büyüme',
];

// Bearish signals — events likely to push BIST / TRY downward
const BEARISH_KEYWORDS = [
    'rate hike', 'rate hikes', 'faiz artırım', 'faiz artırdı', 'faiz yükselt',
    'inflation surge', 'inflation soars', 'enflasyon artışı', 'enflasyon yükseldi', 'yüksek enflasyon',
    'crisis', 'kriz', 'crash', 'recession', 'durgunluk', 'contraction',
    'default', 'temerrüt', 'debt crisis',
    'war', 'savaş', 'conflict', 'attack', 'bombing', 'saldırı',
    'sanctions', 'yaptırım', 'embargo',
    'earthquake', 'deprem', 'magnitude 6', 'magnitude 7', 'magnitude 8',
    'devaluation', 'devalüasyon', 'currency collapse',
    'bank run', 'capital flight', 'sermaye kaçışı',
    'coup', 'darbe', 'political instability',
    'sell-off', 'selloff', 'market crash', 'sert düşüş', 'sert kayıp',
    'miss expectations', 'worse than expected', 'beklentilerin altında',
    'layoffs', 'mass layoffs', 'unemployment surge',
    'oil shock', 'supply disruption', 'arz krizi',
];

function detectSignalDirection(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    let bullScore = 0;
    let bearScore = 0;
    for (const kw of BULLISH_KEYWORDS) {
        if (text.includes(kw)) bullScore++;
    }
    for (const kw of BEARISH_KEYWORDS) {
        if (text.includes(kw)) bearScore++;
    }
    if (bullScore === 0 && bearScore === 0) return 'neutral';
    if (bullScore > bearScore) return 'bullish';
    if (bearScore > bullScore) return 'bearish';
    return 'neutral'; // tie → ambiguous
}

// Specific event types that warrant higher confidence (clearly classifiable)
const HIGH_CONFIDENCE_EVENT_TYPES = new Set([
    'rate_hike', 'rate_cut', 'rate_hold', 'earthquake',
    'coup', 'war_conflict', 'sanctions', 'whale_transaction',
    'gdp', 'inflation', 'employment',
]);

// Generic/noisy event types that warrant a confidence penalty
const LOW_CONFIDENCE_EVENT_TYPES = new Set([
    'news', 'social_media', 'central_bank_announcement',
    'geopolitical_news', 'macro_news', 'security_news',
]);

function computeConfidenceScore(article, affectedAssets, signalDirection) {
    let score = article.source_weight || 0.1;

    // Boost for specific, classifiable event types
    if (HIGH_CONFIDENCE_EVENT_TYPES.has(article.event_type)) {
        score = Math.min(1.0, score + 0.15);
    }

    // Penalty for generic/noisy events
    if (LOW_CONFIDENCE_EVENT_TYPES.has(article.event_type)) {
        score = Math.max(0.05, score - 0.10);
    }

    // Boost when BIST or USD/TRY are directly mentioned
    if (affectedAssets.includes('BIST') || affectedAssets.includes('USD/TRY')) {
        score = Math.min(1.0, score + 0.10);
    } else if (affectedAssets.length > 0) {
        score = Math.min(1.0, score + 0.05);
    }

    // Penalty for ambiguous direction (unclear impact on price)
    if (signalDirection === 'neutral') {
        score = Math.max(0.05, score - 0.05);
    }

    // Hard penalty for social media (very noisy source)
    if (article.event_type === 'social_media') {
        score = Math.max(0.05, score - 0.15);
    }

    return Math.round(score * 100) / 100;
}

// ---------------------------------------------------------------------------
// Source tier — determines trust level of the originating source.
//   tier_1 : official / primary (central banks, wire agencies)
//   tier_2 : established financial media
//   tier_3 : aggregators, scrapers, re-publishers
//   tier_4 : social media
// Used by ALPET to gate trade decisions: only tier_1/2 unlock full position.
// ---------------------------------------------------------------------------
const SOURCE_TIERS = {
    tier_1: new Set([
        'federal reserve', 'bank of england', 'european central bank', 'bank of japan',
        'usgs', 'emsc', 'noaa', 'who', 'cdc',
        'anadolu agency', 'anadolu agency tr',
    ]),
    tier_2: new Set([
        'bloomberg markets', 'bloomberg economics', 'bloomberg ht',
        'financial times', 'ft world',
        'reuters', 'associated press',
        'nyt world', 'nyt business',
        'bbc world', 'bbc business', 'bbc breaking',
        'cnbc', 'marketwatch', 'investing.com',
        'al jazeera', 'guardian world',
        'haberturk ekonomi', 'ntv ekonomi', 'dunya gazetesi',
        'whale alert',
    ]),
    tier_3: new Set([
        'bloomberg ht scraper', 'tcmb via google news',
        'yahoo finance', 'cnn breaking',
    ]),
    tier_4: new Set([
        'twitter',
    ]),
};

function detectSourceTier(source) {
    const s = (source || '').toLowerCase();
    if (SOURCE_TIERS.tier_1.has(s)) return 'tier_1';
    if (SOURCE_TIERS.tier_2.has(s)) return 'tier_2';
    if (SOURCE_TIERS.tier_3.has(s)) return 'tier_3';
    if (SOURCE_TIERS.tier_4.has(s)) return 'tier_4';
    return 'tier_2'; // safe default for unlisted established sources
}

const ASSET_KEYWORDS = {
    'BIST':    ['bist', 'borsa istanbul', 'thyao', 'garan', 'isctr', 'akbnk', 'kchol', 'sasa', 'tuprs', 'eregl', 'halkb', 'vakbn'],
    'USD/TRY': ['usd/try', 'usdtry', 'dolar', 'dollar', 'turkish lira', 'türk lirası', 'kur'],
    'EUR/TRY': ['eur/try', 'eurtry', 'euro ', 'avrupa', 'european central bank'],
    'oil':     ['oil', 'petrol', 'crude', 'brent', 'wti', 'opec', 'enerji'],
    'gold':    ['gold', 'altın', 'xau', 'precious metal'],
    'silver':  ['silver', 'gümüş', 'xag'],
    'BTC':     ['bitcoin', 'btc'],
    'ETH':     ['ethereum', 'eth'],
    'bonds':   ['bond', 'treasury', 'yield', 'faiz', 'tahvil', 'eurobond'],
    'banks':   ['bank', 'banka', 'fed', 'ecb', 'tcmb', 'cbrt', 'interest rate', 'merkez bankası'],
};

// High-impact keywords raise importance_score — critical for trading signal priority
const HIGH_IMPACT_KEYWORDS = [
    'rate hike', 'rate cut', 'emergency', 'crisis', 'crash', 'war', 'attack', 'default',
    'sanctions', 'earthquake', 'outbreak', 'pandemic', 'election', 'coup', 'devaluation',
    'inflation', 'recession', 'faiz artırım', 'faiz indirim', 'enflasyon', 'merkez bankası',
    'whale alert', 'magnitude 7', 'magnitude 8', 'magnitude 9', 'deprem', 'sel', 'yangın',
    'nato', 'nuclear', 'nükleer', 'gerilim', 'savaş', 'kriz',
    'faiz artır', 'faiz indir', 'faiz karar',
    'unemployment surge', 'bank run', 'capital flight', 'currency crisis', 'devalüasyon',
];

function detectAffectedAssets(text) {
    const lower = text.toLowerCase();
    return Object.entries(ASSET_KEYWORDS)
        .filter(([, keywords]) => keywords.some(kw => lower.includes(kw)))
        .map(([asset]) => asset);
}

function extractKeywords(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    const stopWords = new Set([
        'this', 'that', 'with', 'from', 'have', 'will', 'been', 'they', 'their',
        'said', 'after', 'over', 'into', 'more', 'also', 'some', 'what', 'when',
        'were', 'under', 'about', 'would', 'could', 'should', 'which', 'there',
    ]);
    const words = text.match(/[a-züğışçö]{4,}/g) || [];
    const freq = {};
    for (const w of words) {
        if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([w]) => w);
}

function detectLanguage(title) {
    const trChars = /[üğışçöÜĞİŞÇÖ]/;
    const trWords = /\b(ve|bir|için|olan|oldu|merkez|bankası|faiz|enflasyon|borsa|dolar|türk|türkiye)\b/i;
    if (trChars.test(title) || trWords.test(title)) return 'tr';
    return 'en';
}

function computeImportanceScore(article) {
    let score = article.source_weight || 0.1;
    const text = `${article.title} ${article.content}`.toLowerCase();
    for (const kw of HIGH_IMPACT_KEYWORDS) {
        if (text.includes(kw)) {
            score = Math.min(1.0, score + 0.15);
        }
    }
    return Math.round(score * 100) / 100;
}

function validateISOTimestamp(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        return new Date().toISOString();
    }
    return date.toISOString();
}

/**
 * Normalize raw collector output into a structured article ready for Supabase.
 *
 * Required by collector contracts:
 *   { source, title, content, url, published_at, source_weight, category, event_type, raw_data? }
 *
 * Added by normalizer:
 *   { keywords, affected_assets, importance_score, language }
 */
function normalizeNews(newsArray) {
    return newsArray
        .filter(news => news && typeof news.title === 'string' && news.title.trim().length > 0)
        .map(news => {
            const title          = (news.title || '').trim();
            const content        = (news.content || '').trim();
            const affectedAssets = detectAffectedAssets(`${title} ${content}`);
            const signalDir      = detectSignalDirection(title, content);
            return {
                source:           news.source || 'unknown',
                title,
                content,
                url:              news.url || '',
                published_at:     validateISOTimestamp(news.published_at || new Date().toISOString()),
                source_weight:    news.source_weight || 0.1,
                source_tier:      detectSourceTier(news.source),
                category:         news.category || 'general',
                event_type:       news.event_type || 'news',
                keywords:         extractKeywords(title, content),
                affected_assets:  affectedAssets,
                raw_data:         news.raw_data || null,
                importance_score: computeImportanceScore(news),
                signal_direction: signalDir,
                confidence_score: computeConfidenceScore(news, affectedAssets, signalDir),
                language:         news.language || detectLanguage(title),
            };
        });
}

module.exports = { normalizeNews };
