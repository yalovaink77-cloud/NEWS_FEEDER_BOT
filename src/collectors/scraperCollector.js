require('dotenv').config();
const axios   = require('axios');
const cheerio = require('cheerio');
const Parser  = require('rss-parser');

// ---------------------------------------------------------------------------
// TCMB (Turkish Central Bank) — coverage via Google News RSS
// tcmb.gov.tr press-release page is a JavaScript-rendered IBM WPS portal;
// static HTML contains no news items. Google News RSS is used instead and
// provides real-time aggregated TCMB/CBRT headlines from Turkish media.
//
// ⚠️  source_weight is intentionally kept LOW (0.25) because this is a
// secondary aggregator, NOT an official TCMB press release endpoint.
// Giving it 0.55 would cause the confidence scorer to treat aggregated
// third-party coverage as if it were a direct central bank announcement.
// ---------------------------------------------------------------------------
async function scrapeTCMB() {
    const rssParser = new Parser({ timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    try {
        const feed = await rssParser.parseURL(
            'https://news.google.com/rss/search?q=TCMB+merkez+bankasi+faiz&hl=tr&gl=TR&ceid=TR:tr',
        );
        const articles = feed.items.map(item => ({
            source:        'TCMB via Google News',
            title:         item.title || '',
            content:       item.contentSnippet || '',
            url:           item.link || '',
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: 0.25,
            category:      'central_bank',
            event_type:    detectCBEventType(item.title || ''),
            language:      'tr',
            raw_data:      null,
        }));
        console.log(`✓ TCMB (Google News): ${articles.length} items`);
        return articles;
    } catch (error) {
        console.error('✗ TCMB collector error:', error.message);
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

        // Bloomberg HT: article links contain a 7-digit numeric ID in the slug (e.g. /slug-3772740)
        // and use the `title` attribute on the <a> element for the headline.
        const seen = new Set();
        $('a[href][title]').each((_, el) => {
            const href  = $(el).attr('href') || '';
            const title = $(el).attr('title') || '';
            // Only news article slugs — filter out nav/tag/author links
            if (title.length < 10 || !href.match(/\/[^/]+-\d{6,}$/) || seen.has(href)) return;
            seen.add(href);
            // published_at is unknown for scraped links (no timestamp in HTML);
            // mark as null so the normalizer falls back to now() only once,
            // and dedup by URL prevents re-insertion on the next cron tick.
            articles.push({
                source:        'Bloomberg HT',
                title,
                content:       '',
                url:           href.startsWith('http') ? href : `https://www.bloomberght.com${href}`,
                published_at:  null,
                source_weight: 0.20,
                category:      'turkish_market',
                event_type:    'news',
                language:      'tr',
                raw_data:      null,
            });
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