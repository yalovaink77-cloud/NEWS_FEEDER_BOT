const axios = require('axios');
const Parser = require('rss-parser');
const parser = new Parser();

// Significant earthquakes of last 30 days (M2.5+ globally)
const USGS_URL  = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson';
const EMSC_URL  = 'https://www.emsc-csem.org/service/rss/rss.php?limit=20';
const NOAA_URL  = 'https://www.ncei.noaa.gov/access/monitoring/climate-at-a-glance/global/time-series/rss.xml';

async function getUSGSEarthquakes() {
    try {
        const response = await axios.get(USGS_URL);
        const features = response.data?.features || [];
        console.log(`✓ USGS: ${features.length} significant earthquakes`);
        return features.map(e => {
            const mag = e.properties.mag;
            const place = e.properties.place || 'unknown location';
            return {
                source:        'USGS',
                title:         `Earthquake M${mag} - ${place}`,
                content:       `Magnitude ${mag} earthquake near ${place}.`,
                url:           e.properties.url || USGS_URL,
                published_at:  e.properties.time ? new Date(e.properties.time).toISOString() : new Date().toISOString(),
                source_weight: mag >= 6.0 ? 0.50 : mag >= 5.0 ? 0.35 : 0.20,
                category:      'disaster',
                event_type:    'earthquake',
                raw_data: {
                    magnitude:  mag,
                    depth_km:   e.geometry?.coordinates?.[2],
                    place,
                    usgs_id:    e.id,
                },
            };
        });
    } catch (error) {
        console.error('✗ USGS error:', error.message);
        return [];
    }
}

async function getEMSCEarthquakes() {
    try {
        const result = await parser.parseURL(EMSC_URL);
        console.log(`✓ EMSC: ${result.items.length} items`);
        return result.items.map(item => ({
            source:        'EMSC',
            title:         item.title || '',
            content:       item.contentSnippet || item.summary || '',
            url:           item.link || EMSC_URL,
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: 0.30,
            category:      'disaster',
            event_type:    'earthquake',
            raw_data:      null,
        }));
    } catch (error) {
        console.error('✗ EMSC error:', error.message);
        return [];
    }
}

async function getNOAAWeather() {
    try {
        const result = await parser.parseURL(NOAA_URL);
        console.log(`✓ NOAA: ${result.items.length} items`);
        return result.items.map(item => ({
            source:        'NOAA',
            title:         item.title || '',
            content:       item.contentSnippet || item.summary || '',
            url:           item.link || NOAA_URL,
            published_at:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            source_weight: 0.20,
            category:      'disaster',
            event_type:    'weather',
            raw_data:      null,
        }));
    } catch (error) {
        console.error('✗ NOAA error:', error.message);
        return [];
    }
}

async function getNaturalDisasters() {
    console.log('Collecting Natural Disasters...');
    const [usgs, emsc, noaa] = await Promise.all([
        getUSGSEarthquakes(),
        getEMSCEarthquakes(),
        getNOAAWeather(),
    ]);
    return [...usgs, ...emsc, ...noaa];
}

module.exports = { getNaturalDisasters };