
import * as util from 'util';
import * as program from 'commander';
import { WebScraper } from './webScraper';

var scraper = new WebScraper();

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


/*scraper.get('http://www.themoviedb.org/search', { query: 'cosmos' })
	.find('.results .item:nth-child(-n+3)')
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
		console.log(util.inspect(results, false, null));
	})
	.then(null, error => {
		console.log(error);
	});*/
