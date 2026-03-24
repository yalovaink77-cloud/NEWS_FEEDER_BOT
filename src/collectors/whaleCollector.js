require('dotenv').config();
const axios = require('axios');

const WHALE_API_KEY = process.env.WHALE_ALERT_API_KEY;
const MIN_VALUE_USD = 1_000_000; // Only report transactions >= $1M

async function fetchWhaleAlerts() {
    if (!WHALE_API_KEY) {
        console.warn('⚠️  WHALE_ALERT_API_KEY not set, skipping whale collector.');
        return [];
    }

    try {
        const response = await axios.get('https://api.whale-alert.io/v1/transactions', {
            params: {
                api_key:   WHALE_API_KEY,
                currency:  'btc,eth,usdt,usdc',
                min_value: MIN_VALUE_USD,
            },
        });

        const transactions = response.data?.transactions || [];
        console.log(`✓ Whale Alert: ${transactions.length} large transactions fetched`);

        return transactions.map(tx => {
            const amountUsd = tx.amount_usd ? `$${(tx.amount_usd / 1e6).toFixed(1)}M` : 'unknown';
            const currency  = (tx.currency || 'crypto').toUpperCase();
            return {
                source:        'Whale Alert',
                title:         `Whale Alert: ${amountUsd} ${currency} moved`,
                content:       `${tx.amount || ''} ${currency} transferred (value ~${amountUsd}). From: ${tx.from?.owner_type || 'unknown'} → To: ${tx.to?.owner_type || 'unknown'}`,
                url:           `https://whale-alert.io`,
                published_at:  tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
                source_weight: 0.15,
                category:      'crypto',
                event_type:    'whale_transaction',
                raw_data: {
                    currency:        tx.currency,
                    amount:          tx.amount,
                    amount_usd:      tx.amount_usd,
                    from_owner_type: tx.from?.owner_type,
                    to_owner_type:   tx.to?.owner_type,
                    transaction_type: tx.transaction_type,
                    hash:            tx.hash,
                },
            };
        });
    } catch (error) {
        console.error('✗ Whale Alert collector error:', error.message);
        return [];
    }
}

module.exports = { fetchWhaleAlerts };