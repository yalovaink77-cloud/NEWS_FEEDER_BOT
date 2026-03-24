const axios = require('axios');
const fetch = require('node-fetch');

const commodityFeeds = [
    { source: 'Metals.Live', url: 'https://www.metals.live/' },
    { source: 'Commodity.com', url: 'https://www.commodity.com/rss/' },
    { source: 'Kitco', url: 'https://www.kitco.com/rss/news.html' },
    { source: 'Mining.com', url: 'https://www.mining.com/feed/' }
];

async function getGoldPrice() {
    try {
        const response = await axios.get('https://api.metals.live/v1/spot/gold');
        console.log('✓ Gold Prices fetched');
        return response.data;
    } catch (error) {
        console.error('✗ Gold Price API error:', error.message);
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

async function getCommoditiesNews() {
    console.log('Collecting Commodities News...');
    const feeds = await Promise.all(commodityFeeds.map(fetchRSS));
    const prices = await getGoldPrice();
    return { feeds: feeds.filter(f => f !== undefined), prices };
}

module.exports = { getCommoditiesNews };