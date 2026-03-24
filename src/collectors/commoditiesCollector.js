const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

const COMMODITY_FEEDS = [
    { source: 'Commodity.com', url: 'https://www.commodity.com/rss/',     source_weight: 0.20 },
    { source: 'Kitco',         url: 'https://www.kitco.com/rss/news.html', source_weight: 0.25 },
    { source: 'Mining.com',    url: 'https://www.mining.com/feed/',        source_weight: 0.15 },
];

async function getGoldPrice() {
    try {
        const response = await axios.get('https://api.metals.live/v1/spot/gold');
        console.log('✓ Gold price fetched');
        return response.data;
    } catch (error) {
        console.error('✗ Gold price API error:', error.message);
        return null;
    }
}

async function fetchCommodityFeed(feed) {
    try {
        const result = await parser.parseURL(feed.url);
        console.log(`✓ Commodities: ${feed.source} (${result.items.length} items)`);
        return result.items.map(item => ({
            source:        feed.source,
            title:         item.title || '',
            content:       item.contentSnippet || item.content || item.summary || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: feed.source_weight,
            category:      'commodity',
            event_type:    'commodity_news',
            raw_data:      null,
        }));
    } catch (error) {
        console.error(`✗ Commodity feed error [${feed.source}]: ${error.message}`);
        return [];
    }
}

async function getCommoditiesNews() {
    console.log('Collecting Commodities News...');
    const [feedResults, goldPrice] = await Promise.all([
        Promise.all(COMMODITY_FEEDS.map(fetchCommodityFeed)),
        getGoldPrice(),
    ]);

    const articles = feedResults.flat();

    // Add a synthetic gold price article if price data is available
    if (goldPrice) {
        articles.push({
            source:        'Metals.Live API',
            title:         'Gold Spot Price Update',
            content:       typeof goldPrice === 'object' ? JSON.stringify(goldPrice) : String(goldPrice),
            url:           'https://api.metals.live/v1/spot/gold',
            published_at:  new Date().toISOString(),
            source_weight: 0.30,
            category:      'commodity',
            event_type:    'price_update',
            raw_data:      { asset: 'gold', price: goldPrice },
        });
    }

    return articles;
}

module.exports = { getCommoditiesNews };