
declare module 'csscrape' {

	export var scraper: IWebScraper;

	export interface IWebScraper {
		get(url: string, query?: {}): IWebScraper;
		filter(selector: string): IWebScraper;
		select(propertySelectors: string | {}): IWebScraper,
		follow(selector: string): IWebScraper;
		done<T>(): Promise<T[]>;
	}

	export interface ILogger {
		info(data: any, ...moreData: any[]): void;
		warn(data: any, ...moreData: any[]): void;
		error(data: any, ...moreData: any[]): void;
	}

	export interface IHttpClient {
		get(url: string, query?: {}): Promise<IHttpResponse>;
	}

	export interface IHttpResponse {
		url: string;
		data: string;
	}

	export class WebScraper implements IWebScraper {
		constructor(log?: ILogger, httpClient?: IHttpClient);
		get(url: string, query?: {}): WebScraper;
		filter(selector: string): WebScraper;
		select(propertySelectors: string | {}): WebScraper;
		follow(selector: string): WebScraper;
		done<T>(): Promise<T[]>;
	}
}