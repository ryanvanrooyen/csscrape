# csscrape
A simple, lightweight, promise-based web scraper for Node.js.

## Basic Usage
Example - Scraping the most dependend-upon packages from NPM's main page:

```js
var scraper = require('csscrape')();

scraper.get('www.npmjs.com')
	.select('.packages .name')
	.done()
	.then(results => console.log(results));

/*
Results:
[ 'lodash',
  'async',
  'request',
  'underscore',
  'express',
  'commander',
  'debug',
  'chalk',
  'q',
  'bluebird',
  'mkdirp',
  'colors' ]
*/
```


### Use simple JSON & CSS to describe the data you want
Example - Same as above, but only get the first 2 packages and their details:

```js
var scraper = require('csscrape')();

scraper.get('www.npmjs.com')
	.filter('.packages li:nth-child(-n+2)')
	.select({
		name: '.name',
		info: {
			author: '.author a',
			version: '.version',
			updated: '.author span'
		}
	})
	.done()
	.then(results => console.log(results));

/*
Results:
[ { name: 'lodash',
    info:
     { author: '3.10.1',
       version: '3.10.1',
       updated: '2015-08-04T06:05:06.887Z' } },
  { name: 'async',
    info:
     { author: '1.5.0',
       version: '1.5.0',
       updated: '2015-10-26T01:41:14.220Z' } } ]
*/
```


### Follow links to scrape related data
Example - Same as above, but follow each package's link to grab Git URL and status:

```js
var scraper = require('csscrape')();

scraper.get('www.npmjs.com')
	.filter('.packages li:nth-child(-n+2)')
	.select({
		name: '.name',
		info: {
			author: '.author a',
			version: '.version',
			updated: '.author span'
		}
	})
	.follow('h3 a')
	.select({
		gitUrl: '.sidebar a[href^=https://github.com]'
	})
	.done()
	.then(results => console.log(results));

/*
Results:
[ { name: 'lodash',
    info: {
		author: '3.10.1',
    	version: '3.10.1',
    	updated: '2015-08-04T06:05:06.887Z'
	},
    gitUrl: 'https://github.com/lodash/lodash'
  },
  { name: 'async',
    info: {
		author: '1.5.0',
    	version: '1.5.0',
    	updated: '2015-10-26T01:41:14.220Z'
	},
    gitUrl: 'https://github.com/caolan/async'
  } ]
*/
```