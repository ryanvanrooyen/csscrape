
export var scrape: (url: string) => IScraper;

export type ObjectSelector = {[prop: string]: ElementSelector | ObjectSelector};
export type ElementSelector = string | string[];
export type DataSelector = ElementSelector | ObjectSelector;

export interface IScraper {
	filter(selector: string): IScraper;
	select(selector: DataSelector): IScraper,
	follow(selector: string): IScraper;
	done<T>(): Promise<T[]>;
}

export interface ILogger {
	info(data: any, ...moreData: any[]): void;
	warn(data: any, ...moreData: any[]): void;
	error(data: any, ...moreData: any[]): void;
}

export interface IHttpResponse {
	url: string;
	data: string;
}

export interface IHttpClient {
	get(url: string): Promise<IHttpResponse>;
}

export class Scraper implements IScraper {
	constructor(log?: ILogger, httpClient?: IHttpClient);
	get(url: string): Scraper;
	filter(selector: string): Scraper;
	select(selector: DataSelector): Scraper;
	follow(selector: string): Scraper;
	done<T>(): Promise<T[]>;
}
