require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const bearerToken = process.env.TWITTER_BEARER_TOKEN;

// Turkish financial market keywords for BIST-relevant signal detection
const FINANCE_KEYWORDS = [
    'Borsa Istanbul', 'BIST', 'Turkish economy', 'TRY', 'Merkez Bankası',
    'TCMB', 'Türkiye ekonomi', 'enflasyon', 'faiz', 'USDTRY',
];

async function searchFinanceNews() {
    if (!bearerToken) {
        console.warn('⚠️  TWITTER_BEARER_TOKEN not set, skipping Twitter collector.');
        return [];
    }

    const client = new TwitterApi(bearerToken);
    try {
        const query = FINANCE_KEYWORDS.map(kw => `"${kw}"`).join(' OR ');
        const response = await client.v2.search(query, {
            max_results: 20,
            'tweet.fields': ['created_at', 'author_id', 'lang'],
        });

        if (!response.data || !response.data.data) return [];

        console.log(`✓ Twitter: ${response.data.data.length} tweets fetched`);
        return response.data.data.map(tweet => ({
            source:        'Twitter',
            title:         tweet.text.slice(0, 200),
            content:       tweet.text,
            url:           `https://twitter.com/i/web/status/${tweet.id}`,
            published_at:  tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString(),
            source_weight: 0.10,
            category:      'turkish_market',
            event_type:    'social_media',
            language:      tweet.lang === 'tr' ? 'tr' : 'en',
            raw_data:      { tweet_id: tweet.id, author_id: tweet.author_id },
        }));
    } catch (error) {
        console.error('✗ Twitter collector error:', error.message);
        return [];
    }
}

module.exports = { searchFinanceNews };