const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeNews } = require('../src/normalizer');

test('filters out null and empty-title items', () => {
    const out = normalizeNews([
        null,
        { title: '' },
        { title: '   ' },
        { source: 'Reuters', title: 'Valid headline', content: 'x' },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].title, 'Valid headline');
});

test('classifies tier_1 central bank source and bearish rate-hike direction', () => {
    const [n] = normalizeNews([{
        source: 'Federal Reserve',
        title: 'Fed announces rate hike amid inflation surge',
        content: '',
        source_weight: 0.4,
        event_type: 'rate_hike',
    }]);
    assert.equal(n.source_tier, 'tier_1');
    assert.equal(n.signal_direction, 'bearish');
    assert.ok(n.confidence_score > 0.4);
    assert.ok(n.importance_score > 0.4);
});

test('twitter source is tier_4 with low confidence', () => {
    const [n] = normalizeNews([{
        source: 'twitter',
        title: 'some crypto chatter',
        content: '',
        source_weight: 0.05,
        event_type: 'social_media',
    }]);
    assert.equal(n.source_tier, 'tier_4');
    assert.ok(n.confidence_score <= 0.1);
});

test('detects affected assets and neutral direction when no signal keywords', () => {
    const [n] = normalizeNews([{
        source: 'Bloomberg HT',
        title: 'BIST 100 endeksi gün ortasında yatay seyrediyor',
        content: 'dolar sabit',
    }]);
    assert.ok(n.affected_assets.includes('BIST'));
    assert.ok(n.affected_assets.includes('USD/TRY'));
    assert.equal(n.signal_direction, 'neutral');
});

test('invalid timestamp falls back to a valid ISO string', () => {
    const [n] = normalizeNews([{
        source: 'X', title: 'headline', published_at: 'not-a-date',
    }]);
    assert.ok(!isNaN(new Date(n.published_at).getTime()));
});
