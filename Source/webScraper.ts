
import * as urls from 'url';
import * as cheerio from 'cheerio';
import * as querystring from 'querystring';
import { ILogger, NullLogger } from './logging';
import { IHttpClient, HttpClient } from './httpClient';
import { ICssParser, ISelectorDetails, CssParser } from './cssParser';

export interface IWebScraper {
	get(url: string, query?: {}): IWebScraper;
	find(selector: string): IWebScraper;
	select(propertySelectors: string | {}): IWebScraper,
	follow(selector: string): IWebScraper;
	done<T>(): Promise<T[]>;
}

export class WebScraper implements IWebScraper {

	private currentResults: Promise<IScraperResult[]>;

	constructor(private log: ILogger = new NullLogger(),
		private httpClient: IHttpClient = new HttpClient(log),
		private cssParser: ICssParser = new CssParser(log)) {
	}

	get(url: string, query?: {}) {

		if (url && url.indexOf('://') === -1)
			url = 'http://' + url;

		this.currentResults = this.getUrl(url, query).then(result => [result]);
		return this;
	}

	find(selector: string) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {
			results = results.filter(r => r !== null);
			var parsedSelector = this.cssParser.parse(selector);
			return this.selectResults(results, parsedSelector);
		});

		return this;
	}

	select(propertySelectors: string | {}) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {
			results = results.filter(r => r !== null);
			results.forEach(result => {
				this.setDataResult(propertySelectors, result);
			});
			return results;
		});

		return this;
	}

	follow(selector: string) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {
			results = results.filter(r => r !== null);

			var parsedSelector = this.cssParser.parse(selector);
			var newResults = this.selectResults(results, parsedSelector);

			var loads = newResults.map(r => {
				var cheerio = r.$(r.element);
				var attribute = null;

				if (!parsedSelector.attrFilter)
					attribute = cheerio.attr('href');
				else
					attribute = parsedSelector.attrFilter(cheerio);

				return this.createAlwaysResolvedPromise(
					this.getUrl(attribute, null, r));
			});

			if (!loads.length)
				throw ('could not find data to follow: ' + selector);

			return Promise.all(loads);
		});

		return this;
	}

	done<T>() {
		this.checkIfValidResults();
		var lastResults = this.currentResults;
		this.currentResults = null;

		var finalPromise = lastResults.then(results => {

			results = results.filter(r => r !== null);
			var allData = results.map(r => {
				var data = this.getCurrentData(r);
				// If this is top level result from no selector specifed,
				// send back the html that was retrieved from the get.
				if (!data && !r.parentResult && results.length === 1)
					data = r.$.html();
				return data;
			}).filter(d => d);
			var dataList = [];
			allData.forEach(data => this.addToList(dataList, data));
			return <T[]>dataList;
		});

		finalPromise.catch(error => this.log.error(error));

		return finalPromise;
	}

	private checkIfValidResults() {
		if (!this.currentResults)
			throw 'All new scrapings must start with a call to .get()';
	}

	private addToList(list: any[], data: any) {
		if (Array.isArray(data)) {
			data.forEach(entry => this.addToList(list, entry));
		}
		else if (list.indexOf(data) === -1)
			list.push(data);
	}

	private selectResults(results: IScraperResult[], selectorDetails: ISelectorDetails) {

		var childResults = results.map(result => {
			var cheerio = result.$(result.element);
			var selection = cheerio.find(selectorDetails.selector);
			if (selectorDetails.pseudoFilter)
				selection = selectorDetails.pseudoFilter(selection);
			return selection.get().map(el => {
				var childResult: IScraperResult = {
					parentResult: result,
					$: result.$,
					element: el,
					data: null,
					currentUrl: result.currentUrl
				};
				return childResult;
			})
		});

		return this.flatten(childResults);
	}

	private setDataResult(selectors: string | {}, result: IScraperResult) {

		if (typeof selectors === 'string') {
			var values = this.selectData(selectors, result);
			result.data = values || [];
		}
		else {
			var data = this.getCurrentData(result) || {};
			if (this.createDataResults(selectors, result, data))
				result.data = data;
		}
	}

	private createDataResults(selectors: {}, result: IScraperResult, data: {}) {

		var dataHasValues = false;
		for (var prop in selectors) {
			var selector = selectors[prop];
			var foundValues = this.createDataResult(prop, selector, result, data);
			dataHasValues = dataHasValues || foundValues;
		}
		return dataHasValues;
	}

	private createDataResult(prop: string, selector: string | {},
		result: IScraperResult, data: {}) {

		var dataHasValues = false;
		var dataShouldBeArray = false;
		if (this.stringEndsWith(prop, '[]')) {
			dataShouldBeArray = true;
			prop = prop.substring(0, prop.length - 2);
		}

		var values = [];
		if (selector instanceof Object) {
			var childData = {};
			if (this.createDataResults(selector, result, childData)) {
				dataHasValues = true;
				values = [childData];
			}
		}
		else {
			values = this.selectData(<string>selector, result);
			dataHasValues = values && values.length > 0;
		}

		if (dataShouldBeArray) {
			if (!data[prop])
				data[prop] = [];
			data[prop] = data[prop].concat(values);
		}
		else {
			data[prop] = values[0] || null;
		}

		return dataHasValues;
	}

	private stringEndsWith(str: string, value: string) {
		str = (str || '').trim();
		var index = str.indexOf(value);
		return index !== -1 && index === str.length - value.length;
	}

	private selectData(selector: string, result: IScraperResult) {

		var parsedSelector = this.cssParser.parse(selector);
		selector = parsedSelector.selector;

		var cheerio = result.$(result.element).find(selector);
		if (parsedSelector.pseudoFilter)
			cheerio = parsedSelector.pseudoFilter(cheerio);
		var elems = cheerio.get();

		var values = elems.map(e => {
			var value: string = null;
			if (parsedSelector.attrFilter) {
				value = parsedSelector.attrFilter(result.$(e));

				if (value && parsedSelector.attr === 'href' ||
					parsedSelector.attr === 'src')
					value = urls.resolve(result.currentUrl, value);
			}
			else {
				value = result.$(e).text();
			}
			return value && value.trim();
		});
		values = values.filter(v => v && v.length > 0);
		return values;
	}

	private getCurrentData(result: IScraperResult) {

		while (!result.data && result.parentResult)
			result = result.parentResult;

		return result.data || null;
	}

	private getUrl(url: string, query?: {}, previousResult: IScraperResult = null) {

		try {
			url = this.validateUrl(url, previousResult);
		}
		catch (err) {
			return Promise.reject<IScraperResult>(err);
		}

		return this.httpClient.get(url, query).then(resp => {

			var $ = this.parseHtml(url, resp.data);
			var result: IScraperResult = {
				parentResult: previousResult,
				$: $,
				element: $.root().get(0),
				data: null,
				currentUrl: resp.url
			};
			return result;
		});
	}

	private validateUrl(url: string, previousResult: IScraperResult) {

		if (!url || !url.length)
			throw 'url could not be found';

		var parsedUrl = urls.parse(url);
		var isRelativeUrl = !parsedUrl.protocol || !parsedUrl.protocol.length;

		if (isRelativeUrl && !previousResult) {
			throw `url must be an absolute url: ${url}`;
		}
		else if (isRelativeUrl) {
			url = urls.resolve(previousResult.currentUrl, url);
		}
		return url;
	}

	private parseHtml(url: string, html: string) {
		if (!html || !html.length)
				throw 'received no html from url: ' + url;
		try {
			return cheerio.load(html, { normalizeWhitespace: true });
		}
		catch (exc) {
			throw `unable to parse html from url ${url}: ${html}`;
		}
	}

	private flatten<T>(values: T[][]) {
		return values.reduce((x, y) => x.concat(y), []);
	}

	private createAlwaysResolvedPromise<T>(promise: Promise<T>) {
		return new Promise<T>((resolve, reject) => {
			promise
				.then(value => resolve(value))
				.then(null, error => this.log.error(error))
				.then(null, error => resolve(null))
		});
	}
}

export var scraper = new WebScraper();

interface IScraperResult {
	parentResult: IScraperResult;
	$: CheerioStatic;
	element: CheerioElement;
	data: any;
	currentUrl: string;
}
