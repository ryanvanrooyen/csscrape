
const { scrape } = require('../bin/scraper.js');

scrape('www.npmjs.com/browse/depended')
    .filter('main section:nth-child(-n+2)')
    .select({
        name: 'h3',
        info: {
            desc: 'p',
            author: 'h4 + div a',
            info: 'h4 + div span',
        }
    })
    .follow('a[href^="/package"]')
    .select({
        dependencies: 'main > div > ul li:nth-child(3) a span span',
        dependents: 'main > div > ul li:nth-child(4) a span span',
    })
    .done()
    .then(results => console.log(results));
