// ---------------------------------------------------------------------------
// Ortak RSS parser factory.
//
// rss-parser'ın varsayılan User-Agent'ı çoğu haber sitesi (aa.com.tr, haberturk,
// ntv, dunya, bloomberght, bazı BBC/FT uçları) tarafından bot olarak algılanıp
// 403 Forbidden ile engelleniyordu. Bu durumda collector hata fırlatmadan sessizce
// boş dizi dönüyor, bot "çalışıyor" görünürken downstream trading botu veri açlığı
// çekiyordu. Buradaki tek merkezi client tarayıcı UA'sı + timeout ile bunu aşar.
// ---------------------------------------------------------------------------

const Parser = require('rss-parser');

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
};

function createRssParser(extraOptions = {}) {
    return new Parser({
        headers: DEFAULT_HEADERS,
        timeout: 12000,
        ...extraOptions,
    });
}

module.exports = { createRssParser, DEFAULT_HEADERS };
