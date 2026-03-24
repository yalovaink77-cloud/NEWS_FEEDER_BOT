const fetch = require('node-fetch');
const cbFeeds = [
    { source: 'Federal Reserve', url: 'https://www.federalreserve.gov/feeds/news.xml' },
    { source: 'ECB', url: 'https://www.ecb.europa.eu/rss/pressreleases_en.xml' },
    { source: 'CBRT', url: 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB+EN' },
    { source: 'Bank of England', url: 'https://www.bankofengland.co.uk/.feed/rss/news.xml' },
    { source: 'Bank of Japan', url: 'https://www.boj.or.jp/en/rss/news_en.xml' }
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

async function getCentralBankNews() {
    console.log('Collecting Central Bank News...');
    const results = await Promise.all(cbFeeds.map(fetchRSS));
    return results.filter(r => r !== undefined);
}

module.exports = { getCentralBankNews };