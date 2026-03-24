const fetch = require('node-fetch');
const macroFeeds = [
    { source: 'Trading Economics', url: 'https://tradingeconomics.com/rss/' },
    { source: 'Investing.com', url: 'https://www.investing.com/rss/news_25.rss' },
    { source: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { source: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
    { source: 'MarketWatch', url: 'https://feeds.marketwatch.com/marketwatch/topstories/' }
];

async function fetchRSS(feed) {
    try {
        const response = await fetch(feed.url);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        console.log(`✓ Fetched ${feed.source}`);
        return { source: feed.source, data };
    } catch (error) {
        console.error(`✗ Error fetching ${feed.source}: ${error.message}`);
    }
}

async function getMacroEconomicsNews() {
    console.log('Collecting Macro Economics News...');
    const results = await Promise.all(macroFeeds.map(fetchRSS));
    return results.filter(r => r !== undefined);
}

module.exports = { getMacroEconomicsNews };