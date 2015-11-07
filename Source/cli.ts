
import * as fs from 'fs';
import * as program from 'commander';
import { WebScraper } from './webScraper';
import { ILogger, NullLogger, ConsoleLogger } from './logging';

var logger: ILogger = new NullLogger();
var scraper: WebScraper = null;
var options: {}[] = [];

function setVerbose() {
	logger = new ConsoleLogger();
	logger.info(`Set to verbose mode`);
}

function filter(sel) {
	if (!sel) return;
	options.push({ 'filter': sel });
}

function select(sel) {
	if (!sel) return;
	try { sel = JSON.parse(sel) } catch (e) {}
	options.push({ 'select': sel });
}

function follow(sel) {
	if (!sel) return;
	options.push({ 'follow': sel });
}

function runScraper(url) {

	logger.info(`Scraping ${url}`);
	var scraper = new WebScraper(logger);
	scraper.get(url);

	options.forEach(option => {
		for (var prop in option) {
			var params = option[prop];
			logger.info(`${prop}: ${params}`);
			scraper[prop].call(scraper, params);
		}
	});

	scraper.done<any>().then(results => {
		if (results.length && results.length === 1)
			results = results[0];
		console.log(results);
	});
}

function getVersion() {
	var packageFile = fs.readFileSync('package.json', 'utf8');
	var packageInfo = JSON.parse(packageFile);
	console.log(packageInfo.version);
	process.exit(0);
}

program
	.usage("cssscrape <url>")
	.action(runScraper)
	.option('-V, --version', 'output the version number', getVersion)
	.option('-f, --filter <selector>', 'Filter to specific data in the results', filter, [])
	.option('-s, --select <selector>', 'Select data from the results (string or json string)', select, [])
	.option('-l, --followlink <selector>', 'Select a link from the data to follow', follow, [])
	.option('-v, --verbose', 'Set logging to verbose', setVerbose)
	.parse(process.argv);


if (!program.args || !program.args.length) {

	var rawArgs = <string[]>(<any>program).rawArgs || [];
	if (rawArgs.indexOf('-V') === -1 &&
		rawArgs.indexOf('--version') === -1) {

		program.help();
	}
}
