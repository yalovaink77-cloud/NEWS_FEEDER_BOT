const Parser = require('rss-parser');
const parser = new Parser();

const SECURITY_FEEDS = [
    { source: 'Reuters Security', url: 'https://feeds.reuters.com/reuters/worldNews',     source_weight: 0.30 },
    { source: 'BBC Breaking',     url: 'http://feeds.bbci.co.uk/news/rss.xml',            source_weight: 0.25 },
    { source: 'AP Breaking',      url: 'https://apnews.com/ap_feeds/TopNews',             source_weight: 0.25 },
    { source: 'CNN Breaking',     url: 'http://rss.cnn.com/rss/cnn_topstories.rss',       source_weight: 0.15 },
    { source: 'Guardian World',   url: 'https://www.theguardian.com/world/rss',           source_weight: 0.15 },
];

function detectSecurityEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('attack') || t.includes('bombing') || t.includes('terror'))    return 'terror_attack';
    if (t.includes('war') || t.includes('conflict') || t.includes('military'))    return 'war_conflict';
    if (t.includes('hack') || t.includes('cyber') || t.includes('breach'))       return 'cyber_attack';
    if (t.includes('hostage') || t.includes('kidnap'))                            return 'hostage';
    if (t.includes('breaking') || t.includes('urgent') || t.includes('flash'))   return 'breaking_news';
    return 'security_news';
}

async function fetchSecurityFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Security: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'security',
            event_type:    detectSecurityEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Security feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getSecurityAlerts() {
    console.log('Collecting Security & Breaking News...');
    const results = await Promise.all(SECURITY_FEEDS.map(fetchSecurityFeed));
    return results.flat();
}

module.exports = { getSecurityAlerts };