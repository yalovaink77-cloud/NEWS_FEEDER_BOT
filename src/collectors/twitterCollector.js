const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi('YOUR_BEARER_TOKEN'); // Replace with your actual bearer token

const financeKeywords = ['Borsa Istanbul', 'BIST', 'Turkish economy', 'TRY', 'Merkez Bankası'];

async function searchFinanceNews() {
    try {
        const query = financeKeywords.join(' OR ');
        const tweets = await client.v2.search(query, { max_results: 10 });

        const normalizedNews = tweets.data.map(tweet => ({
            source_weight: 0.10,
            content: tweet.text,
            created_at: tweet.created_at,
            author: tweet.author_id
        }));

        return normalizedNews;
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return [];
    }
}

module.exports = { searchFinanceNews };