const fetch = require('node-fetch');
const pandemicFeeds = [
  { source: 'WHO', url: 'https://www.who.int/feeds/entity/csr/don/en/feed/' },
  { source: 'CDC', url: 'https://tools.cdc.gov/podcasts/rss.asp?feedid=133' },
  { source: 'Reuters Health', url: 'https://feeds.reuters.com/reuters/healthNews' },
  { source: 'BBC Health', url: 'http://feeds.bbci.co.uk/news/health/rss.xml' }
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

async function getPandemicNews() {
  console.log('Collecting Pandemic News...');
  const results = await Promise.all(pandemicFeeds.map(fetchRSS));
  return results.filter(r => r !== undefined);
}

module.exports = { getPandemicNews };