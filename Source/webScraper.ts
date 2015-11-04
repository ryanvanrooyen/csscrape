
import * as cheerio from 'cheerio';
import * as querystring from 'querystring';
import { IHttpClient, HttpClient } from './httpClient';

export interface IWebScraper {
	get(url: string, query?: {}): IWebScraper;
	find(selector: string): IWebScraper;
	data(propertySelectors: {}): IWebScraper,
	follow(selector: string): IWebScraper;
	promise<T>(): Promise<T[]>;
}

export class WebScraper implements IWebScraper {

	private currentResults: Promise<IScraperResult[]>;

	constructor(private httpClient: IHttpClient = new HttpClient()) {
		if (!this.httpClient) throw 'httpClient must be defined';
	}

	get(url: string, query?: {}) {
		this.currentResults = this.getUrl(url, query).then(result => [result]);
		return this;
	}

	find(selector: string) {
		this.currentResults = this.currentResults.then(results => {
			var parsedSelector = this.parseSelector(selector);
			selector = parsedSelector.selector;
			return this.select(results, selector);
		});

		return this;
	}

	data(propertySelectors: {}) {

		this.currentResults = this.currentResults.then(results => {
			results.forEach(result => {
				var data = this.getData(result) || {};
				var sucess = this.createDataResult(propertySelectors, result, data);
				if (sucess && !result.data)
					result.data = data;
			});
			return results;
		});

		return this;
	}

	follow(selector: string) {
		this.currentResults = this.currentResults.then(results => {

			var parsedSelector = this.parseSelector(selector);
			selector = parsedSelector.selector;
			var newResults = this.select(results, selector);

			var loads = newResults.map(r => {
				var cheerio = r.$(r.element);
				var attribute = null;

				if (!parsedSelector.attr)
					attribute = cheerio.attr('href');
				else
					attribute = parsedSelector.attrFilter(cheerio);

				return this.getUrl(attribute, null, r);
			});

			return Promise.all(loads);
		});

		return this;
	}

	promise<T>() {
		return this.currentResults.then(results => {
			var allData = results.map(r => this.getData(r)).filter(d => d);
			var data = [];
			allData.forEach(d => {
				if (data.indexOf(d) === -1)
					data.push(d);
			});
			return <T[]>data;
		});
	}

	private select(results: IScraperResult[], selector: string) {

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

	private createDataResult(propertySelectors: {},
		result: IScraperResult, data: {}) {

		for (var prop in propertySelectors) {

			var selector = propertySelectors[prop];
			var dataShouldBeArray = false;
			var endOfPropName = prop.length > 2 ? prop.substr(prop.length - 2, 2) : '';

			if (endOfPropName === '[]') {
				dataShouldBeArray = true;
				prop = prop.substring(0, prop.length - 2);
			}

			var values = null;
			if (selector instanceof Object) {
				var childData = {};
				if (!this.createDataResult(selector, result, childData))
					return false;
				values = [childData];
			}
			else {
				var parsedSelector = this.parseSelector(selector);
				selector = parsedSelector.selector;

				var cheerio = result.$(result.element);
				var elems = cheerio.find(selector).get();
				values = elems.map(e => {
					var value: string = null;
					if (parsedSelector.attrFilter)
						value = parsedSelector.attrFilter(result.$(e));
					else
						value = result.$(e).text();
					return value && value.trim();
				});
				values = values.filter(v => v && v.length);
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
		}

		return true;
	}

	private getData(result: IScraperResult) {

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

	private parseSelector(selector: string) {

		selector = selector || '';
		var attr: string = null;
		var attrValue: string = null;
		var attrFilter: string = null;
		var attrFilters = ['~', '|', '^', '$', '*'];

		var attrStartIndex = selector.indexOf('[');
		var attrEndIndex = selector.indexOf(']');
		if (attrStartIndex !== -1 && attrEndIndex !== -1) {
			attr = selector.substring(attrStartIndex + 1, attrEndIndex);
			selector = selector.substr(0, attrStartIndex);
		}

		if (attr) {
			var attrValueIndex = attr.indexOf('=');
			if (attrValueIndex !== -1) {
				attrValue = attr.substr(attrValueIndex + 1);
				attrValue = attrValue.replace(/["']/g, "");
				attr = attr.substr(0, attrValueIndex);

				var qualifier = attr.substr(attr.length - 1);
				var qualifierIndex = attrFilters.indexOf(qualifier);
				if (qualifierIndex !== -1) {
					attrFilter = qualifier;
					attr = attr.substr(0, attr.length - 1);
				}
			}
		}

		return {
			selector: selector,
			attr: attr,
			attrFilter: this.getAttrFilter(attrFilter, attr, attrValue)
		};
	}

	private getAttrFilter(attrFilter: string, attr: string, attrValue: string) {

		if (!attr)
			return null;

		attr = attr.toLowerCase();

		if (!attrFilter && !attrValue)
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal;
			}
		if (!attrFilter && attrValue)
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return attrValue === selectedVal ? el.text() : null;
			}
		if (attrFilter === '^')
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal && selectedVal.indexOf(attrValue) === 0 ? selectedVal : null;
			}

		return null;
	}
}

interface IScraperResult {
	parentResult: IScraperResult;
	$: CheerioStatic;
	element: CheerioElement;
	data: any;
}
