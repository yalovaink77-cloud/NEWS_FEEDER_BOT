require('dotenv').config();
const cron = require('node-cron');

const { getCentralBankNews }      = require('./collectors/centralBankCollector');
const { getCommoditiesNews }      = require('./collectors/commoditiesCollector');
const { getEnergyNews }           = require('./collectors/energyCollector');
const { getGeopoliticalNews }     = require('./collectors/geopoliticalCollector');
const { getMacroEconomicsNews }   = require('./collectors/macroEconomicsCollector');
const { getNaturalDisasters }     = require('./collectors/naturalDisastersCollector');
const { getPandemicNews }         = require('./collectors/pandemicCollector');
const { getPoliticalNews }        = require('./collectors/politicalCollector');
const { fetchRSSFeeds }           = require('./collectors/rssCollector');
const { scrapeTCMB, scrapeBloombergHT } = require('./collectors/scraperCollector');
const { getSecurityAlerts }       = require('./collectors/securityCollector');
const { searchFinanceNews }       = require('./collectors/twitterCollector');
const { fetchWhaleAlerts }        = require('./collectors/whaleCollector');
const { normalizeNews }           = require('./normalizer');
const { pushNews }                = require('./supabasePusher');

const COLLECTORS = [
    getCentralBankNews,
    getCommoditiesNews,
    getEnergyNews,
    getGeopoliticalNews,
    getMacroEconomicsNews,
    getNaturalDisasters,
    getPandemicNews,
    getPoliticalNews,
    fetchRSSFeeds,
    getSecurityAlerts,
    searchFinanceNews,
    fetchWhaleAlerts,
    scrapeTCMB,
    scrapeBloombergHT,
];

async function runAllCollectors() {
    console.log(`\n[${new Date().toISOString()}] Running all collectors...`);

    const settled = await Promise.allSettled(COLLECTORS.map(fn => fn()));

    const allArticles = [];
    for (const result of settled) {
        if (result.status === 'fulfilled') {
            const items = Array.isArray(result.value) ? result.value : [];
            allArticles.push(...items);
        } else {
            console.error('Collector error:', result.reason?.message || result.reason);
        }
    }

    const normalized = normalizeNews(allArticles);
    console.log(`Collected ${allArticles.length} raw articles → ${normalized.length} valid after normalize.`);

    let pushed = 0;
    for (const article of normalized) {
        const ok = await pushNews(article);
        if (ok) pushed++;
    }

    console.log(`[${new Date().toISOString()}] Done. ${pushed}/${normalized.length} new articles pushed.\n`);
}

// Run immediately on start
runAllCollectors();

// Schedule to run every 15 minutes
cron.schedule('*/15 * * * *', runAllCollectors);

console.log('News Feeder Bot is running (cron: every 15 minutes)...');
