var scraper = require('csscrape').scraper;

scraper.get('www.npmjs.com')
    .select('.packages .name')
    .done()
    .then(results => console.log(results));