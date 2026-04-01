const Parser = require('rss-parser');
const parser = new Parser();

// NOTE: NYT World and BBC World are intentionally excluded here — they are
// already collected by geopoliticalCollector.js. Duplicating them causes the
// same URL to arrive with two different categories; URL-based dedup retains
// whichever collector wins the race, making the category non-deterministic.
// This list keeps only security-specific feeds not present elsewhere.
const SECURITY_FEEDS = [
    { source: 'CNN Breaking',   url: 'http://rss.cnn.com/rss/cnn_topstories.rss',             source_weight: 0.18 },
    { source: 'Guardian World', url: 'https://www.theguardian.com/world/rss',                 source_weight: 0.18 },
    { source: 'Al Jazeera',     url: 'https://www.aljazeera.com/xml/rss/all.xml',             source_weight: 0.20 },
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