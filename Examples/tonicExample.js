
const { scrape } = require('csscrape');

await scrape('www.npmjs.com/browse/depended')
    .select('main h3')
    .done();
