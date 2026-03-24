require('dotenv').config();
const axios  = require('axios');
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// TCMB (Turkish Central Bank) press releases scraper
// Selectors are based on TCMB's public HTML structure; verify with browser
// DevTools if the site layout changes.
// ---------------------------------------------------------------------------
async function scrapeTCMB() {
    try {
        const response = await axios.get(
            'https://www.tcmb.gov.tr/wps/wcm/connect/en/tcmb+en/main+menu/announcements/press+releases',
            { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } },
        );
        const $ = cheerio.load(response.data);
        const articles = [];

        // TCMB press release list: each item typically in a <li> or <article> with an <a>
        $('ul.press-release-list li, .pressReleaseList li, ul.haberler li').each((_, el) => {
            const anchor  = $(el).find('a').first();
            const title   = anchor.text().trim();
            const href    = anchor.attr('href') || '';
            const dateStr = $(el).find('span.date, .tarih, time').first().text().trim();

            if (title.length > 5) {
                articles.push({
                    source:        'TCMB',
                    title,
                    content:       '',
                    url:           href.startsWith('http') ? href : `https://www.tcmb.gov.tr${href}`,
                    published_at:  dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
                    source_weight: 0.55,
                    category:      'central_bank',
                    event_type:    detectCBEventType(title),
                    language:      'tr',
                    raw_data:      null,
                });
            }
        });

        console.log(`✓ TCMB scraper: ${articles.length} press releases`);
        return articles;
    } catch (error) {
        console.error('✗ TCMB scraper error:', error.message);
        return [];
    }
}

// ---------------------------------------------------------------------------
// Bloomberg HT scraper — top headlines from the Turkish financial news site
// ---------------------------------------------------------------------------
async function scrapeBloombergHT() {
    try {
        const response = await axios.get('https://www.bloomberght.com', {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const $ = cheerio.load(response.data);
        const articles = [];

        // Bloomberg HT headline selectors (main news list)
        $('div.news-item, article.news-card, ul.news-list li').each((_, el) => {
            const anchor  = $(el).find('a').first();
            const title   = anchor.attr('title') || anchor.text().trim();
            const href    = anchor.attr('href') || '';
            const dateStr = $(el).find('time, span.time, .tarih').first().text().trim();

            if (title.length > 5) {
                articles.push({
                    source:        'Bloomberg HT',
                    title,
                    content:       '',
                    url:           href.startsWith('http') ? href : `https://www.bloomberght.com${href}`,
                    published_at:  dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
                    source_weight: 0.20,
                    category:      'turkish_market',
                    event_type:    'news',
                    language:      'tr',
                    raw_data:      null,
                });
            }
        });

        console.log(`✓ Bloomberg HT scraper: ${articles.length} headlines`);
        return articles;
    } catch (error) {
        console.error('✗ Bloomberg HT scraper error:', error.message);
        return [];
    }
}

function detectCBEventType(title) {
    const t = title.toLowerCase();
    if (t.includes('faiz') && (t.includes('artırım') || t.includes('yüksel'))) return 'rate_hike';
    if (t.includes('faiz') && (t.includes('indirim') || t.includes('düşür')))  return 'rate_cut';
    if (t.includes('enflasyon'))                                                return 'inflation_statement';
    if (t.includes('toplantı') || t.includes('karar'))                         return 'policy_decision';
    return 'central_bank_announcement';
}

module.exports = { scrapeTCMB, scrapeBloombergHT };