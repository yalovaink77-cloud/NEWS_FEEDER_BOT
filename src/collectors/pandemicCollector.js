const { createRssParser } = require('./_rssClient');
const parser = createRssParser();

// Verified working as of 2026-03-25. WHO DON=404, CDC=broken XML, Reuters DNS dead; replaced.
const PANDEMIC_FEEDS = [
    { source: 'WHO',        url: 'https://www.who.int/rss-feeds/news-english.xml',  source_weight: 0.40 },
    { source: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml',     source_weight: 0.25 },
    { source: 'NYT Health', url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml', source_weight: 0.20 },
];

function detectPandemicEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('outbreak') || t.includes('salgın') || t.includes('hastalık'))  return 'outbreak';
    if (t.includes('pandemic') || t.includes('pandemi'))                       return 'pandemic';
    if (t.includes('vaccine') || t.includes('aşı'))                            return 'vaccine';
    if (t.includes('lockdown') || t.includes('quarantine'))                   return 'lockdown';
    if (t.includes('death') || t.includes('ölüm') || t.includes('fatality'))   return 'mortality_report';
    return 'health_news';
}

async function fetchPandemicFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Pandemic: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'pandemic',
            event_type:    detectPandemicEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Pandemic feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getPandemicNews() {
    console.log('Collecting Pandemic/Health News...');
    const results = await Promise.all(PANDEMIC_FEEDS.map(fetchPandemicFeed));
    return results.flat();
}

module.exports = { getPandemicNews };