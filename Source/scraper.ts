
import { ILogger, NullLogger } from './logging';
import { IHttpClient, HttpClient } from './httpClient';
import { resolveURL, parseHTML, getTiming, endsWith, flatten } from './utils';


export type ObjectSelector = {[prop: string]: ElementSelector | ObjectSelector};
export type ElementSelector = string | string[];
export type DataSelector = ElementSelector | ObjectSelector;


export interface IScraper {
	filter(selector: string): IScraper;
	select(selector: DataSelector): IScraper,
	follow(selector: string): IScraper;
	done<T>(): Promise<T[]>;
}


interface Result {
	parent: Result;
	$: CheerioStatic,
	elements: Cheerio;
	data: any;
	url: string;
}


export class Scraper implements IScraper {

	private currentResults: Promise<Result[]>;

	constructor(private log: ILogger = new NullLogger(),
		private httpClient: IHttpClient = new HttpClient(log)) {
	}

	get(url: string) {
		if (url && url.indexOf('://') === -1) {
			url = 'http://' + url;
		}
		this.currentResults = this.getUrl(url).then(result => [result]);
		return this;
	}

	filter(selector: string) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {
			var newResults = results
				.filter(r => r)
				.map(result => {
					var selection = result.elements.find(selector);
					return selection.toArray().map(el => {
						var newResult: Result = {
							parent: result,
							$: result.$,
							elements: result.$(el),
							data: null,
							url: result.url
						};
						return newResult;
					});
				});
			return flatten(newResults);
		});
		return this;
	}

	select(selector: DataSelector) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {
			results = results.filter(r => r);
			results.forEach(result => {
				this.setDataResult(selector, result);
			});
			return results;
		});
		return this;
	}

	follow(selector: string) {
		this.checkIfValidResults();
		this.currentResults = this.currentResults.then(results => {

			var loads: Promise<Result>[] = flatten(results.map(result => {
				var selection = result.elements.find(selector);
				return selection.toArray().map(el => {

					var cheerio = result.$(el);
					var url = cheerio.attr('href') || cheerio.text();

					return this.getUrl(url, result).catch(err => {
						this.log.error(err);
						return null;
					});
				});
			}));

			if (!loads.length) {
				throw `Could not find data to follow: ${selector}`;
			}

			var start = new Date();
			return Promise.all(loads).then(newResults => {
				var timing = getTiming(start);
				this.log.info(`Loaded ${loads.length} url(s) in ${timing} seconds`);
				return newResults;
			});
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
				if (!data && !r.parent && results.length === 1)
					data = r.$.html();
				return data;
			});
			var dataList = [];
			allData.forEach(data => this.aggregateFinalData(dataList, data));
			return <T[]>dataList;
		});

		finalPromise.catch(error => {
			this.log.error(error);
			throw error;
		});

		return finalPromise;
	}

	private checkIfValidResults() {
		if (!this.currentResults)
			throw 'All new scrapings must start with a call to .get()';
	}

	private aggregateFinalData(list: any[], data: any) {
		if (!data) {
			return;
		}
		if (Array.isArray(data)) {
			data.forEach(entry => this.aggregateFinalData(list, entry));
		}
		else {
			// Child results append data on their parents, so we might be
			// trying to re-add the child data that already exists in the results:
			if (typeof data === 'object' && list.indexOf(data) !== -1) {
				return;
			}
			list.push(data);
		}
	}

	private setDataResult(selector: DataSelector, result: Result) {
		if (typeof selector === 'string' || Array.isArray(selector)) {
			var values = this.selectData(selector, result);
			result.data = values || [];
		}
		else {
			var data = this.getCurrentData(result) || {};
			if (this.createDataResults(selector, result, data))
				result.data = data;
		}
	}

	private createDataResults(selectors: ObjectSelector, result: Result, data: {} | any[]) {
		var dataHasValues = false;
		for (var prop in selectors) {
			var selector = selectors[prop];
			var foundValues = this.createDataResult(prop, selector, result, data);
			dataHasValues = dataHasValues || foundValues;
		}
		return dataHasValues;
	}

	private createDataResult(prop: string, selector: DataSelector, result: Result, data: {} | any[]) {
		var dataHasValues = false;
		var dataShouldBeArray = false;
		if (endsWith(prop, '[]')) {
			dataShouldBeArray = true;
			prop = prop.substring(0, prop.length - 2);
		}

		var values = [];
		if (typeof selector === 'string' || Array.isArray(selector)) {
			values = this.selectData(selector, result);
			dataHasValues = values && values.length > 0;
		} else {
			var childData = dataShouldBeArray ? [] : {};
			if (this.createDataResults(selector, result, childData)) {
				dataHasValues = true;
				values = Array.isArray(childData) ? childData : [childData];
			}
		}

		if (Array.isArray(data)) {
			for (var i = 0; i < values.length; i++) {
				var entry: {} = null;
				if (data[i]) {
					entry = data[i];
				} else {
					entry = {};
					data.push(entry);
				}
				entry[prop] = values[i];
			}

		} else {
			if (dataShouldBeArray) {
				if (!data[prop])
					data[prop] = [];
				data[prop]  = data[prop].concat(values);
			} else {
				data[prop] = values[0] || null;
			}
		}

		return dataHasValues;
	}

	private selectData(selector: ElementSelector, result: Result) {
		if (Array.isArray(selector)) {
			var currentSelector = selector[0] || null;
			var attrSelector = selector[1] || null;
		} else {
			var currentSelector = selector;
			var attrSelector: string = null;
		}
		var selection = result.elements.find(currentSelector);
		var values = selection.toArray().map(e => {
			const el = result.$(e);
			var value = attrSelector ? el.attr(attrSelector.toLowerCase()) : el.text();
			return value && value.trim();
		});
		values = values.filter(v => v);
		return values;
	}

	private getCurrentData(result: Result) {
		while (!result.data && result.parent)
			result = result.parent;
		return result.data || null;
	}

	private getUrl(url: string, previousResult: Result = null) {
		try {
			url = resolveURL(url, previousResult && previousResult.url);
		}
		catch (err) {
			return Promise.reject<Result>(err);
		}

		var start = new Date();
		return this.httpClient.get(url).then(resp => {

			var timing = getTiming(start);
			this.log.info(`Loaded url ${resp.url} in ${timing} seconds`);

			var $ = parseHTML(url, resp.data);
			var result: Result = {
				parent: previousResult,
				$: $,
				elements: $.root(),
				data: null,
				url: resp.url
			};
			return result;
		});
	}
}


export var scrape = (url: string) => new Scraper().get(url);
