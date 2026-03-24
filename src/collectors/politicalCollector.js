const Parser = require('rss-parser');
const parser = new Parser();

const POLITICAL_FEEDS = [
    { source: 'Reuters Politics', url: 'https://feeds.reuters.com/reuters/politicsNews',           source_weight: 0.30 },
    { source: 'BBC Politics',     url: 'http://feeds.bbci.co.uk/news/politics/rss.xml',            source_weight: 0.25 },
    { source: 'Guardian Politics', url: 'https://www.theguardian.com/international/politics/rss', source_weight: 0.20 },
    { source: 'CNN Politics',     url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',               source_weight: 0.15 },
];

function detectPoliticalEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('election') || t.includes('vote') || t.includes('seçim'))  return 'election';
    if (t.includes('sanction') || t.includes('embargo'))                      return 'sanctions';
    if (t.includes('resign') || t.includes('istifa'))                         return 'resignation';
    if (t.includes('cabinet') || t.includes('minister') || t.includes('bakan')) return 'cabinet_change';
    if (t.includes('protest') || t.includes('demonstration'))                 return 'protest';
    if (t.includes('coup') || t.includes('darbe'))                            return 'coup';
    return 'political_news';
}

async function fetchPoliticalFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Political: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'political',
            event_type:    detectPoliticalEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Political feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getPoliticalNews() {
    console.log('Collecting Political News...');
    const results = await Promise.all(POLITICAL_FEEDS.map(fetchPoliticalFeed));
    return results.flat();
}

module.exports = { getPoliticalNews };