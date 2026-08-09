const { createRssParser } = require('./_rssClient');
const parser = createRssParser();

// Central bank RSS feeds — critical weight for BIST (CBRT decisions move Turkish markets most)
// Verified working as of 2026-03-25. ECB/CBRT/BoJ RSS endpoints are 404; replaced with alternatives.
const CB_FEEDS = [
    { source: 'Federal Reserve',           url: 'https://www.federalreserve.gov/feeds/press_all.xml',         source_weight: 0.40 },
    { source: 'Bank of England Speeches',  url: 'https://www.bankofengland.co.uk/rss/speeches',               source_weight: 0.30 },
    { source: 'Bank of England Research',  url: 'https://www.bankofengland.co.uk/rss/publications',           source_weight: 0.27 },
    { source: 'Bloomberg Economics',       url: 'https://feeds.bloomberg.com/economics/news.rss',             source_weight: 0.30 },
];

function detectCBEventType(title) {
    const t = title.toLowerCase();
    if ((t.includes('rate') || t.includes('faiz')) && (t.includes('hike') || t.includes('raise') || t.includes('increase') || t.includes('artırım'))) return 'rate_hike';
    if ((t.includes('rate') || t.includes('faiz')) && (t.includes('cut') || t.includes('lower') || t.includes('decrease') || t.includes('indirim')))  return 'rate_cut';
    if ((t.includes('rate') || t.includes('faiz')) && t.includes('hold'))                                                                             return 'rate_hold';
    if (t.includes('qe') || t.includes('quantitative easing') || t.includes('asset purchase'))                                                        return 'qe';
    if (t.includes('inflation') || t.includes('enflasyon'))                                                                                           return 'inflation_statement';
    if (t.includes('meeting') || t.includes('decision') || t.includes('policy') || t.includes('toplantı'))                                           return 'policy_decision';
    return 'central_bank_announcement';
}

async function fetchCBFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Central bank: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'central_bank',
            event_type:    detectCBEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Central bank fetch error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getCentralBankNews() {
    console.log('Collecting Central Bank News...');
    const results = await Promise.all(CB_FEEDS.map(fetchCBFeed));
    return results.flat();
}

module.exports = { getCentralBankNews };