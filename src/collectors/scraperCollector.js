const axios = require('axios');
const cheerio = require('cheerio');

const scrapeTCMB = async () => {
    try {
        const response = await axios.get('https://www.tcmb.gov.tr');
        const data = response.data;
        const $ = cheerio.load(data);

        // Example: Scrape policy announcements
        const announcements = [];
        $('selector-for-announcements').each((index, element) => {
            announcements.push({
                text: $(element).text(),
                source: 'TCMB',
                source_weight: 0.25
            });
        });

        return announcements;
    } catch (error) {
        console.error('Error scraping TCMB:', error);
        return [];
    }
};

const scrapeBloombergHT = async () => {
    try {
        const response = await axios.get('https://www.bloomberght.com');
        const data = response.data;
        const $ = cheerio.load(data);

        // Example: Scrape policy announcements
        const announcements = [];
        $('selector-for-bloomberg-announcements').each((index, element) => {
            announcements.push({
                text: $(element).text(),
                source: 'Bloomberg HT',
                source_weight: 0.15
            });
        });

        return announcements;
    } catch (error) {
        console.error('Error scraping Bloomberg HT:', error);
        return [];
    }
};

module.exports = { scrapeTCMB, scrapeBloombergHT };