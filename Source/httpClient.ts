
import * as urls from 'url';
import * as querystring from 'querystring';
import { ILogger, NullLogger } from './logging';
import { IHttpTransport, HttpTransport} from './httpTransport';

export interface IHttpClient {
	get(url: string, query?: {}): Promise<IHttpResponse>;
}

export interface IHttpResponse {
	url: string,
	data: string
}

export class HttpClient implements IHttpClient {

	constructor(private log: ILogger = new NullLogger(),
		private transport: IHttpTransport = new HttpTransport()) {
	}

	get(url: string, query?: {}): Promise<IHttpResponse> {

		if (!url || !url.length)
			return Promise.reject<IHttpResponse>('No url specified to http get.');
		if (query)
			url += '?' + querystring.stringify(query);
		if (url.indexOf('://') === -1)
			url = 'http://' + url;

		var parsedUrl = urls.parse(url);
		if (!parsedUrl.protocol || !parsedUrl.protocol.length) {
			parsedUrl.protocol = 'http:';
		}
		else if (parsedUrl.protocol !== 'http:' &&
			parsedUrl.protocol !== 'https:') {

			return Promise.reject<IHttpResponse>(
				'Invalid url protocol to http get request: ' + parsedUrl.protocol);
		}

		var options = this.getHttpOptions('GET', parsedUrl);

		return this.transport.transfer(parsedUrl, options).then(resp => {

			var newResp = this.handleStatusCodes(url,
				resp.statusCode, resp.headers);

			if (newResp)
				return newResp;

			return { url: url, data: resp.data };
		});
	}

	private getHttpOptions(method: string, url: urls.Url) {
		return {
			method: method,
			hostname: url.host,
			port: null,
			path: url.path,
			headers: {
				accept: '*/*',
				"cache-control": "no-cache",
				"User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
			}
		};
	}

	// Can return a new response to be returned from the client.
	private handleStatusCodes(url: string, statusCode: number,
		headers: {}): Promise<IHttpResponse> {

		if (this.isInRange(statusCode, 200))
			return null;

		var location: string = (<any>headers).location;
		var redirectCodes = [300, 301, 307, 410];
		if (this.isValue(statusCode, redirectCodes) && location) {
			var newUrl = urls.resolve(url, location);
			if (newUrl !== url) {
				this.log.info(`Received ${statusCode} from ${url}`);
				this.log.info(`Going to new url  ${newUrl}`);
				return this.get(newUrl);
			}
		}

		if (!this.isInRange(statusCode, 200)) {
			this.log.error(`Received status code ${statusCode} for url ${url} with headers:`);
			this.log.error(headers);
			throw `Received status code ${statusCode} for url ${url}`;
		}

		return null;
	}

	private isInRange(value: number, numb: number) {
		return value >= numb && value < (numb + 100);
	}

	private isValue(value: number, numbs: number[]) {
		return numbs.some(n => value === n);
	}

	private startsWith(str: string, values: string[]) {
		return values.some(v => str.indexOf(v) === 0);
	}
}
