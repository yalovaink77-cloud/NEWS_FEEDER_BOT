const { createRssParser } = require('./_rssClient');
const parser = createRssParser();

// Verified working as of 2026-03-25. Reuters DNS dead, Trading Economics=403; replaced.
const MACRO_FEEDS = [
    { source: 'Bloomberg Markets', url: 'https://feeds.bloomberg.com/markets/news.rss',              source_weight: 0.30 },
    { source: 'NYT Business',      url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', source_weight: 0.25 },
    { source: 'Investing.com',     url: 'https://www.investing.com/rss/news_25.rss',                 source_weight: 0.25 },
    { source: 'BBC Business',      url: 'http://feeds.bbci.co.uk/news/business/rss.xml',             source_weight: 0.22 },
    { source: 'MarketWatch',       url: 'https://feeds.marketwatch.com/marketwatch/topstories/',     source_weight: 0.20 },
    { source: 'CNBC',              url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',     source_weight: 0.20 },
    { source: 'Yahoo Finance',     url: 'https://finance.yahoo.com/news/rssindex',                   source_weight: 0.18 },
];

function detectMacroEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('gdp') || t.includes('growth') || t.includes('gsyh'))             return 'gdp';
    if (t.includes('inflation') || t.includes('cpi') || t.includes('enflasyon'))     return 'inflation';
    if (t.includes('unemployment') || t.includes('jobs') || t.includes('işsizlik'))  return 'employment';
    if (t.includes('trade balance') || t.includes('deficit') || t.includes('surplus')) return 'trade_balance';
    if (t.includes('pmi') || t.includes('manufacturing'))                            return 'pmi';
    if (t.includes('recession') || t.includes('contraction'))                       return 'recession';
    return 'macro_news';
}

async function fetchMacroFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Macro: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'macro',
            event_type:    detectMacroEventType(item.title || ''),
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Macro feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getMacroEconomicsNews() {
    console.log('Collecting Macro Economics News...');
    const results = await Promise.all(MACRO_FEEDS.map(fetchMacroFeed));
    return results.flat();
}

module.exports = { getMacroEconomicsNews };