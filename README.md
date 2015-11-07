# csscrape
A simple, lightweight, promise-based web scraper for Node.js.

[![npm version](https://badge.fury.io/js/csscrape.svg)](https://badge.fury.io/js/csscrape)

### Install

```sh
$ npm install csscrape
```

## Basic Usage
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Scraping the most dependend-upon packages from NPM's main page:

```js
var scraper = require('csscrape').scraper;

scraper.get('www.npmjs.com')
	.select('.packages .name')
	.done()
	.then(results => console.log(results));

/*
Results:
[ 'lodash', 'async', 'request', 'underscore', 'express', 'commander',
  'debug', 'chalk', 'q', 'bluebird', 'mkdirp', 'colors' ]
*/
```


### Use simple JSON & CSS to describe the data you want
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Same as above, but only get the first 2 packages and their details:

```js
var scraper = require('csscrape').scraper;

scraper.get('www.npmjs.com')
	.filter('.packages li:nth-child(-n+2)')
	.select({
		name: '.name',
		info: {
			author: '.author a:nth-child(2)',
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
     { author: 'jdalton,
       version: '3.10.1',
       updated: '2015-08-04T06:05:06.887Z' } },
  { name: 'async',
    info:
     { author: 'aearly,
       version: '1.5.0',
       updated: '2015-10-26T01:41:14.220Z' } } ]
*/
```


### Follow links to scrape related data
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Same as above, but follow each package's link to grab GitHub url from details page:

```js
var scraper = require('csscrape').scraper;

scraper.get('www.npmjs.com')
	.filter('.packages li:nth-child(-n+2)')
	.select({
		name: '.name',
		info: {
			author: '.author a:nth-child(2)',
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
		author: 'jdalton',
    	version: '3.10.1',
    	updated: '2015-08-04T06:05:06.887Z'
	},
    gitUrl: 'https://github.com/lodash/lodash'
  },
  { name: 'async',
    info: {
		author: 'aearly',
    	version: '1.5.0',
    	updated: '2015-10-26T01:41:14.220Z'
	},
    gitUrl: 'https://github.com/caolan/async'
  } ]
*/
```

## Simple API
You can scrape for data using the five following methods:
```js
/**
 * Get the initial url to start the scrape
 * @param {string} url - the url of the page to scrape
 * @param {{}} query? - optional query to be parsed by Node's querystring
 */
get(url, query);

/**
 * Filter down the current results to create a new data context
 * @param {string} selector - a css selector string
 */
filter(selector);

/**
 * Select data from the current data context
 * @param {string | {}} propertySelectors - a css selector string or selector object
 */
select(propertySelectors);

/**
 * Find a link in the current data context to follow to continue scraping
 * @param {string} selector - a css selector string
 */
follow(selector);

/**
 * Marks the current scrape as finished and returns a Promise of the results
 */
done();
```
_Every scrape **must** begin with a call to .get(url) and end with a call to .done()_


## Command Line Interface
**csscrape** also provides a CLI

```sh
Usage: csscrape <url>

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -f, --filter <selector>      Filter to specific data in the results
    -s, --select <selector>      Select data from the results (string or json string)
    -l, --followlink <selector>  Select a link from the data to follow
    -v, --verbose                Set logging to verbose
```

### Install

```sh
$ npm install csscrape -g
```

###### Example
Same as first example, but using the CLI

```sh
csscrape www.npmjs.com -s '.packages .name'

# Results:
# [ 'lodash', 'async', 'request', 'underscore', 'express', 'commander',
#   'debug', 'chalk', 'q', 'bluebird', 'mkdirp', 'colors' ]
```