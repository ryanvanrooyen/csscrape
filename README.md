# csscrape
A simple, lightweight, promise-based web scraper for Node.js.

[![npm version](https://badge.fury.io/js/csscrape.svg)](https://badge.fury.io/js/csscrape)
[![Build Status](https://travis-ci.org/ryanvanrooyen/csscrape.svg?branch=master)](https://travis-ci.org/ryanvanrooyen/csscrape)

### Install

```sh
$ npm install csscrape
```

## Basic Usage
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Scraping the most dependend-upon packages from NPM's main page:

```js
const { scrape } = require('csscrape');

await scrape('www.npmjs.com/browse/depended')
    .select('main h3')
    .done();

/*
Results (as of 5/25/2020):
[
  'lodash',      'react',      'chalk',
  'request',     'commander',  'moment',
  'express',     'react-dom',  'prop-types',
  'tslib',       'axios',      'debug',
  'fs-extra',    'async',      'bluebird',
  'vue',         'uuid',       'classnames',
  'core-js',     'underscore', 'inquirer',
  'yargs',       'webpack',    'rxjs',
  'mkdirp',      'glob',       'body-parser',
  'dotenv',      'colors',     'typescript',
  'jquery',      'minimist',   'babel-runtime',
  '@types/node', 'aws-sdk',    '@babel/runtime'
]
*/
```


### Use simple JSON & CSS to describe the data you want
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Same as above, but only get the first 2 packages and their details:

```js
const { scrape } = require('csscrape');

await scrape('www.npmjs.com/browse/depended')
    .filter('main section:nth-child(-n+2)')
    .select({
        name: 'h3',
        info: {
            desc: 'p',
            author: 'h4 + div a',
            info: 'h4 + div span',
        }
    })
    .done();

/*
Results (as of 5/25/2020):
[
  {
    name: 'lodash',
    info: {
      desc: 'Lodash modular utilities.',
      author: 'jdalton',
      info: 'published 4.17.15 • 10 months ago'
    }
  },
  {
    name: 'react',
    info: {
      desc: 'React is a JavaScript library for building user interfaces.',
      author: 'acdlite',
      info: 'published 16.13.1 • 2 months ago'
    }
  }
]
*/
```


### Follow links to scrape related data
###### Example - [Try it out in your browser](https://tonicdev.com/npm/csscrape)
Same as above, but follow each package's link to grab number of dependecies from its details page:

```js
const { scrape } = require('csscrape');

await scrape('www.npmjs.com/browse/depended')
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
    .done();

/*
Results (as of 5/25/2020):
[
  {
    name: 'lodash',
    info: {
      desc: 'Lodash modular utilities.',
      author: 'jdalton',
      info: 'published 4.17.15 • 10 months ago'
    },
    dependencies: '0',
    dependents: '115,408'
  },
  {
    name: 'react',
    info: {
      desc: 'React is a JavaScript library for building user interfaces.',
      author: 'acdlite',
      info: 'published 16.13.1 • 2 months ago'
    },
    dependencies: '3',
    dependents: '56,464'
  }
]
*/
```

## Simple API
You can scrape for data using the five following methods:
```js
/**
 * Get the initial url to start the scrape
 * @param {string} url - the url of the page to scrape
 */
scrape(url);

/**
 * Filter down the current results to create a new data context
 * @param {string} selector - a css selector string
 */
filter(selector);

/**
 * Select data from the current data context
 * @param {string | string[] | {}} selector - a css selector string/object
 * Note: To select an attribute value instead of text use string array:
 * Select div text           : .select('div')
 * Select div title attribute: .select(['div', 'title'])
 */
select(selector);

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


## Command Line Interface
**csscrape** also provides a CLI

```sh
Usage: csscrape <url>

  Options:

    -h, --help                   output usage information
    -V, --version                output the version number
    -f, --filter <selector>      Filter to specific data in the results
    -s, --select <selector>      Data selector (string or json string)
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
csscrape www.npmjs.com/browse/depended -s 'main h3'

# Results (as of 5/25/2020):
# [
#   'lodash',      'react',      'chalk',
#   'request',     'commander',  'moment',
#   'express',     'react-dom',  'prop-types',
#   'tslib',       'axios',      'debug',
#   'fs-extra',    'async',      'bluebird',
#   'vue',         'uuid',       'classnames',
#   'core-js',     'underscore', 'inquirer',
#   'yargs',       'webpack',    'rxjs',
#   'mkdirp',      'glob',       'body-parser',
#   'dotenv',      'colors',     'typescript',
#   'jquery',      'minimist',   'babel-runtime',
#   '@types/node', 'aws-sdk',    '@babel/runtime'
# ]
```