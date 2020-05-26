
import { readFileSync } from 'fs';
import { program } from 'commander';
import { Scraper } from './scraper';
import { ILogger, NullLogger, ConsoleLogger } from './logging';


var logger: ILogger = new NullLogger();
var options: {}[] = [];
var url: string = null;


function setVerbose() {
	logger = new ConsoleLogger();
}


function filter(sel) {
	if (!sel) return;
	options.push({filter: sel});
}


function select(sel) {
	if (!sel) return;
	try { sel = JSON.parse(sel) } catch (e) {}
	options.push({select: sel});
}


function follow(sel) {
	if (!sel) return;
	options.push({follow: sel});
}


function getVersion() {
	var packageFile = readFileSync('package.json', 'utf8');
	var packageInfo = JSON.parse(packageFile);
	console.log(packageInfo.version);
	process.exit(0);
}


program
	.arguments('<url>')
	.action(specifiedUrl => {
		url = specifiedUrl;
	})
	.option('-V, --version', 'output the version number', getVersion)
	.option('-f, --filter <selector>', 'Filter to specific data in the results', filter)
	.option('-s, --select <selector>', 'Data selector (string or json string)', select)
	.option('-l, --followlink <selector>', 'Select a link from the data to follow', follow)
	.option('-v, --verbose', 'Set logging to verbose', setVerbose)
	.parse(process.argv);


logger.info(`Scraping ${url}`);
var scraper = new Scraper(logger);
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
