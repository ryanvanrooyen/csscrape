
import * as fs from 'fs';
import * as program from 'commander';
import { WebScraper } from './webScraper';
import { NullLogger, ConsoleLogger } from './logging';

var packageFile = fs.readFileSync('package.json', 'utf8');
var packageInfo = JSON.parse(packageFile);

var logger = new NullLogger();
var selector = null;

function setToVerbose() {
	logger = new ConsoleLogger();
	logger.info(`Set to verbose mode.`);
}

function setSelector(sel) {
	selector = sel;
}

function runScraper(url) {
	logger.info(`Running program...`);
	var scraper = new WebScraper(logger);
	scraper.get(url)
	if (selector)
		scraper.select(selector);
	scraper.done<any>()
		.then(results => {
			if (results.length && results.length === 1)
				results = results[0];
			console.log(results);
		});
}


program
	.version(packageInfo.version)
	.usage("cssscrape <url> -s 'selector'")
	.option('-f, --find <selector>', 'A css selector string')
	.option('-s, --select <selector>', 'A css selector string or json object', setSelector)
	.option('-l, --followlink <selector>', 'A css selector string')
	.option('-v, --verbose', 'Set logging to verbose', setToVerbose)
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
