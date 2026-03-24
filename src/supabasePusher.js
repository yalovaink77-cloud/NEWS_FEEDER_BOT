// src/supabasePusher.js
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl  = process.env.SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Push a normalized article to Supabase.
 * Deduplication is done by URL (preferred) or title fallback.
 * Returns true if inserted, false if duplicate/error.
 */
async function pushNews(article) {
    // Check for duplicate by URL first (more reliable than title)
    const dedupeField = article.url ? 'url' : 'title';
    const dedupeValue = article.url || article.title;

    const { data: existing, error: selectError } = await supabase
        .from('news')
        .select('id')
        .eq(dedupeField, dedupeValue)
        .limit(1);

    if (selectError) {
        console.error('Error checking duplicate:', selectError.message);
        return false;
    }

    if (existing && existing.length > 0) {
        return false; // duplicate
    }

    const { error: insertError } = await supabase
        .from('news')
        .insert([article]);

    if (insertError) {
        console.error('Error inserting article:', insertError.message, '|', article.title);
        return false;
    }

    console.log(`✓ Pushed [${article.category}/${article.event_type}] ${article.title.slice(0, 80)}`);
    return true;
}

module.exports = { pushNews };