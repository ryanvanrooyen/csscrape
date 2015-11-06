# csscrape
A lightweight, promise-based web scraper for Node.js.

## Basic Usage
Scraping the most dependend-upon packages from NPM's main page:

```js
var scraper = require('csscrape')();

scraper.get('www.npmjs.com')
	.select('.packages .name')
	.done()
	.then(results => console.log(results));

// Displayed results:
// [ 'lodash',
//   'async',
//   'request',
//   'underscore',
//   'express',
//   'commander',
//   'debug',
//   'chalk',
//   'q',
//   'bluebird',
//   'mkdirp',
//   'colors' ]
```
