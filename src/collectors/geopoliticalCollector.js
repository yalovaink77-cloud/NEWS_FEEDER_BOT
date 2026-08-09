const { createRssParser } = require('./_rssClient');
const parser = createRssParser();

// Verified working as of 2026-03-25. Reuters DNS dead, AP World=404, UNIAN=404; replaced.
const GEO_FEEDS = [
    { source: 'NYT World',  url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source_weight: 0.30 },
    { source: 'BBC World',  url: 'http://feeds.bbci.co.uk/news/world/rss.xml',               source_weight: 0.25 },
    { source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml',                source_weight: 0.20 },
    { source: 'FT World',   url: 'https://www.ft.com/world?format=rss',                      source_weight: 0.20 },
];

function detectGeoEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('war') || t.includes('savaş') || t.includes('attack') || t.includes('strike')) return 'war_conflict';
    if (t.includes('sanction') || t.includes('embargo') || t.includes('yaptirım'))              return 'sanctions';
    if (t.includes('election') || t.includes('seçim') || t.includes('vote'))                    return 'election';
    if (t.includes('coup') || t.includes('darbe'))                                               return 'coup';
    if (t.includes('ceasefire') || t.includes('peace') || t.includes('barış'))                  return 'ceasefire';
    if (t.includes('nuclear') || t.includes('nükleer') || t.includes('missile'))               return 'nuclear_military';
    return 'geopolitical_news';
}

async function fetchGeoFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Geopolitical: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'geopolitical',
            event_type:    detectGeoEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Geopolitical feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getGeopoliticalNews() {
    console.log('Collecting Geopolitical News...');
    const results = await Promise.all(GEO_FEEDS.map(fetchGeoFeed));
    return results.flat();
}

module.exports = { getGeopoliticalNews };
