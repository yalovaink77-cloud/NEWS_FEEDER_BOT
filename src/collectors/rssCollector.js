const Parser = require('rss-parser');
const parser = new Parser();

// Turkish-focused market feeds — highest weight for BIST analysis
const FEEDS = [
    {
        source: 'KAP',
        // TR URL is the stable endpoint; EN URL (/en/rss) has returned 404 historically
        url: 'https://www.kap.org.tr/tr/rss/bildirim',
        category: 'turkish_market',
        event_type: 'disclosure',
        source_weight: 0.35,
        language: 'tr',
    },
    {
        source: 'Bloomberg HT',
        url: 'https://www.bloomberght.com/rss',
        category: 'turkish_market',
        event_type: 'news',
        source_weight: 0.20,
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
