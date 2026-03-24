// ---------------------------------------------------------------------------
// Asset keyword mapping — used by downstream analysis bot for filtering
// ---------------------------------------------------------------------------
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
            const title   = (news.title || '').trim();
            const content = (news.content || '').trim();
            return {
                source:           news.source || 'unknown',
                title,
                content,
                url:              news.url || '',
                published_at:     validateISOTimestamp(news.published_at || new Date().toISOString()),
                source_weight:    news.source_weight || 0.1,
                category:         news.category || 'general',
                event_type:       news.event_type || 'news',
                keywords:         extractKeywords(title, content),
                affected_assets:  detectAffectedAssets(`${title} ${content}`),
                raw_data:         news.raw_data || null,
                importance_score: computeImportanceScore(news),
                language:         news.language || detectLanguage(title),
            };
        });
}

module.exports = { normalizeNews };
