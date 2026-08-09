const { createRssParser } = require('./_rssClient');

// Ortak factory tarayıcı User-Agent'ı + timeout sağlar; çoğu Türk haber sitesi
// varsayılan rss-parser UA'sını 403 ile blokluyordu (sessiz 0-haber sorunu).
const parser = createRssParser();

// Turkish-focused market feeds — highest weight for BIST analysis
// Note: KAP (kap.org.tr) RSS endpoint returns 404 as of 2025; replaced with
// Turkish financial news aggregates that cover BIST disclosures.
const FEEDS = [
    {
        source: 'Bloomberg HT',
        url: 'https://www.bloomberght.com/rss',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.25,
        language: 'tr',
    },
    {
        source: 'Anadolu Agency TR',
        url: 'https://www.aa.com.tr/tr/rss/default?cat=ekonomi',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.25,
        language: 'tr',
    },
    {
        source: 'Anadolu Agency',
        url: 'https://www.aa.com.tr/en/rss/default?cat=economy',
        category: 'macro',
        event_type: 'news',
        source_weight: 0.20,
        language: 'en',
    },
    {
        source: 'Haberturk Ekonomi',
        url: 'https://www.haberturk.com/rss/ekonomi.xml',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.20,
        language: 'tr',
    },
    {
        source: 'NTV Ekonomi',
        url: 'https://www.ntv.com.tr/ekonomi.rss',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.18,
        language: 'tr',
    },
    {
        source: 'Dunya Gazetesi',
        url: 'https://www.dunya.com/rss/ekonomi.xml',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.20,
        language: 'tr',
    },
];

async function fetchFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      feed.category,
            event_type:    feed.event_type,
            language:      feed.language,
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ RSS fetch error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function fetchRSSFeeds() {
    console.log('Collecting Turkish Market RSS feeds...');
    const results = await Promise.all(FEEDS.map(fetchFeed));
    return results.flat();
}

module.exports = { fetchRSSFeeds };
