
import * as cheerio from 'cheerio';
import * as querystring from 'querystring';
import { IHttpClient, HttpClient } from './httpClient';
import { ICssParser, CssParser } from './cssParser';

export interface IWebScraper {
	get(url: string, query?: {}): IWebScraper;
	find(selector: string): IWebScraper;
	select(propertySelectors: string | {}): IWebScraper,
	follow(selector: string): IWebScraper;
	done<T>(): Promise<T[]>;
}

export class WebScraper implements IWebScraper {

	private currentResults: Promise<IScraperResult[]>;

	constructor(
		private httpClient: IHttpClient = new HttpClient(),
		private cssParser: ICssParser = new CssParser()) {

		if (!this.httpClient) throw 'httpClient must be defined';
		if (!this.cssParser) throw 'cssParser must be defined';
	}

	get(url: string, query?: {}) {
		this.currentResults = this.getUrl(url, query).then(result => [result]);
		return this;
	}

	find(selector: string) {
		this.currentResults = this.currentResults.then(results => {
			var parsedSelector = this.cssParser.parse(selector);
			selector = parsedSelector.selector;
			return this.selectResults(results, selector);
		});

		return this;
	}

	select(propertySelectors: string | {}) {

		this.currentResults = this.currentResults.then(results => {
			results.forEach(result => {

				var info = this.getDataResult(propertySelectors, result);
				if (info.success && !result.data)
					result.data = info.data;
			});
			return results;
		});

		return this;
	}

	follow(selector: string) {
		this.currentResults = this.currentResults.then(results => {

			var parsedSelector = this.cssParser.parse(selector);
			selector = parsedSelector.selector;
			var newResults = this.selectResults(results, selector);

			var loads = newResults.map(r => {
				var cheerio = r.$(r.element);
				var attribute = null;

				if (!parsedSelector.attrFilter)
					attribute = cheerio.attr('href');
				else
					attribute = parsedSelector.attrFilter(cheerio);

				return this.getUrl(attribute, null, r);
			});

			return Promise.all(loads);
		});

		return this;
	}

	done<T>() {
		return this.currentResults.then(results => {
			var allData = results.map(r => this.getCurrentData(r)).filter(d => d);
			var dataList = [];
			allData.forEach(data => this.addToList(dataList, data));
			return <T[]>dataList;
		});
	}

	private addToList(list: any[], data: any) {
		if (Array.isArray(data)) {
			data.forEach(entry => this.addToList(list, entry));
		}
		else if (list.indexOf(data) === -1)
			list.push(data);
	}

	private selectResults(results: IScraperResult[], selector: string) {

		var childResults = results.map(result => {
			var cheerio = result.$(result.element);
			var selection = cheerio.find(selector);
			return selection.get().map(el => {
				var childResult: IScraperResult = {
					parentResult: result,
					$: result.$,
					element: el,
					data: null
				};
				return childResult;
			})
		});

		return this.flatten(childResults);
	}

	private getDataResult(selectors: string | {}, result: IScraperResult) {

		var data: any = null;
		var success = false;

		if (typeof selectors === 'string') {
			var values = this.selectData(selectors, result);
			if (values && values.length) {
				data = values;
				success = true;
			}
		}
		else {
			data = this.getCurrentData(result) || {};
			success = this.createDataResults(selectors, result, data);
		}

		return {
			data: data,
			success: success
		}
	}

	private createDataResults(selectors: {}, result: IScraperResult, data: {}) {

		var success = true;
		for (var prop in selectors) {
			var selector = selectors[prop];
			success = success && this.createDataResult(prop, selector, result, data);
		}
		return success;
	}

	private createDataResult(prop: string, selector: string | {},
		result: IScraperResult, data: {}) {

		var dataShouldBeArray = false;
		var endOfPropName = prop.length > 2 ? prop.substr(prop.length - 2, 2) : '';

		if (endOfPropName === '[]') {
			dataShouldBeArray = true;
			prop = prop.substring(0, prop.length - 2);
		}

		var values = null;
		if (selector instanceof Object) {
			var childData = {};
			if (!this.createDataResults(selector, result, childData))
				return false;
			values = [childData];
		}
		else {
			values = this.selectData(<string>selector, result);
			if (!values.length)
				return false;
		}

		if (dataShouldBeArray) {
			if (!data[prop])
				data[prop] = [];
			data[prop] = data[prop].concat(values);
		}
		else {
			data[prop] = values[0] || null;
		}

		return true;
	}

	private selectData(selector: string, result: IScraperResult) {

		var parsedSelector = this.cssParser.parse(selector);
		selector = parsedSelector.selector;

		var cheerio = result.$(result.element);
		var elems = cheerio.find(selector).get();

		var values = elems.map(e => {
			var value: string = null;
			if (parsedSelector.attrFilter)
				value = parsedSelector.attrFilter(result.$(e));
			else
				value = result.$(e).text();
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

		return this.httpClient.get(url, query).then(html => {

			var $ = cheerio.load(html, { normalizeWhitespace: true });
			var result: IScraperResult = {
				parentResult: previousResult,
				$: $,
				element: $.root().get(0),
				data: null
			};
			return result;
		});
	}

	private flatten<T>(values: T[][]) {
		return values.reduce((x, y) => x.concat(y), []);
	}
}

interface IScraperResult {
	parentResult: IScraperResult;
	$: CheerioStatic;
	element: CheerioElement;
	data: any;
}
