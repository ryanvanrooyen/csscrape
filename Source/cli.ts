
import { WebScraper } from './webScraper';

interface IMovieResult {
	title: string
}


var scraper = new WebScraper();

scraper.get('https://www.themoviedb.org/search', { query: 'cosmos' })
	.find('.results .item')
	.select({
		title: '.info .title'
	})
	.done<IMovieResult>().then(results => {

		results.forEach(result => console.log(result));
	});
