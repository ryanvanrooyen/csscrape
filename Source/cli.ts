
import { WebScraper } from './webScraper';

var scraper = new WebScraper();

scraper.get('https://www.themoviedb.org/search', { query: 'cosmos' })
	.find('.results .item:nth-child(-n+5)')
	.select('.info .title')
	.done<string>().then(results => {

		results.forEach(result => console.log(result));
	});
