
const { scrape } = require('../bin/scraper.js');

scrape('www.npmjs.com/browse/depended')
    .select('main h3')
    .done()
    .then(results => console.log(results));
