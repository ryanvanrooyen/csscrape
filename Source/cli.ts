
import * as fs from 'fs';
import * as program from 'commander';
import { WebScraper } from './webScraper';
import { ILogger, NullLogger, ConsoleLogger } from './logging';

var logger: ILogger = new NullLogger();
var selector: string = null;

function setToVerbose() {
	logger = new ConsoleLogger();
	logger.info(`Set to verbose mode`);
}

function getVersion() {
	var packageFile = fs.readFileSync('package.json', 'utf8');
	var packageInfo = JSON.parse(packageFile);
	console.log(packageInfo.version);
	process.exit(0);
}

function setSelector(sel) {
	selector = sel;
}

function runScraper(url) {
	logger.info(`Scraping ${url}...`);
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
	.usage("cssscrape <url> -s 'selector'")
	.option('-V, --version', 'output the version number', getVersion)
	.option('-f, --find <selector>', 'A css selector string')
	.option('-s, --select <selector>', 'A css selector string or json object', setSelector)
	.option('-l, --followlink <selector>', 'A css selector string')
	.option('-v, --verbose', 'Set logging to verbose', setToVerbose)
	.action(runScraper)
	.parse(process.argv);


if (!program.args || !program.args.length) {

	var rawArgs = <string[]>(<any>program).rawArgs;
	if (rawArgs.indexOf('-V') === -1 &&
		rawArgs.indexOf('--version') === -1) {

		program.help();
	}
}


/*var logger = new ConsoleLogger();
var scraper = new WebScraper(logger);
scraper.get('www.themoviedb.org/search', { query: 'cosmos' })
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
