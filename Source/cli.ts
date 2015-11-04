
import * as util from 'util';
// import * as readline from 'readline';
import { WebScraper } from './webScraper';

// var rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout
// });

interface IMovieResult {
	name: string,
	seasons: string[]
}

var scraper = new WebScraper();

scraper.get('http://www.themoviedb.org/search', { query: 'cosmos' })
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
	.done<IMovieResult>()
		.then(results => {
			console.log(util.inspect(results, false, null));
		})
		.then(null, error => {
			console.log(error);
		});

// rl.question("Press enter to quit...", resp => {
// 	console.log(resp);
// 	rl.close();
// });