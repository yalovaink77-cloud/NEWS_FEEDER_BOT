const axios = require('axios');
const fetch = require('node-fetch');

const energyFeeds = [
    { source: 'OPEC', url: 'https://www.opec.org/news/rss/' },
    { source: 'EIA', url: 'https://www.eia.gov/rss/news.xml' },
    { source: 'Reuters Energy', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { source: 'Bloomberg Energy', url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml' },
    { source: 'Oil Price', url: 'https://oilprice.com/rss/news/' }
];

async function getOilPrices() {
    try {
        const response = await axios.get('https://api.oilpriceapi.com/v1/brent');
        console.log('✓ Oil Prices fetched');
        return response.data;
    } catch (error) {
        console.error('✗ Oil Price API error:', error.message);
        return null;
    }
}

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

async function getEnergyNews() {
    console.log('Collecting Energy News...');
    const feeds = await Promise.all(energyFeeds.map(fetchRSS));
    const prices = await getOilPrices();
    return { feeds: feeds.filter(f => f !== undefined), prices };
}

module.exports = { getEnergyNews };