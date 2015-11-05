
import * as cheerio from 'cheerio';
import * as program from 'commander';
import { WebScraper } from './webScraper';
import { ConsoleLogger } from './logging';

var x = cheerio.name;

var logger = new ConsoleLogger();
var scraper = new WebScraper(logger);

function parseSelector(arg) {
	console.log(arg);
	return arg;
}

function runScraper(url) {
	console.log(url);
}

program
	.version('0.1.0')
	.usage("cssscrape url -s 'selector'")
	.option('-f, --find <selector>', 'A css selector string')
	.option('-s, --select <selector>', 'A css selector string or json object', parseSelector)
	.option('-l, --followlink <selector>', 'A css selector string')
	.option('-v, --verbose', 'Set logging to verbose')
	.command('<url> [options]')
	.action(runScraper)
	.parse(process.argv);

if (!program.args || !program.args.length) {
    program.help();
}


/*scraper.get('https://www.themoviedb.org/search', { query: 'cosmos' })
	.find('.results .item:nth-child(-n+2)')
	.select({
		name: '.title',
		href: '.info a.title[href]'
	})
	.follow('.info a.title')
	.select({
		poster: '#leftCol .poster img[src]',
		'seasons[]': '.season_list li .info h4'
	})
	.done<any>()
	.then(results => {
		logger.info(results);
	})
	.then(null, error => {
		logger.error(error);
	});*/
