
import * as urls from 'url';
import { ILogger, NullLogger } from './logging';
import { IHttpTransport, HttpTransport} from './httpTransport';


export interface IHttpClient {
	get(url: string): Promise<IHttpResponse>;
}


export interface IHttpResponse {
	url: string,
	data: string
}


export class HttpClient implements IHttpClient {

	constructor(private log: ILogger = new NullLogger(),
		private transport: IHttpTransport = new HttpTransport()) {
	}

	get(url: string) {
		try {
			return this.internalGet(url);
		}
		catch (err) {
			return Promise.reject<IHttpResponse>(err);
		}
	}

	private internalGet(url: string): Promise<IHttpResponse> {
		if (!url || !url.length)
			throw 'No url specified to http get.';
		if (url.indexOf('://') === -1)
			url = 'http://' + url;
		var parsedUrl = this.parseUrl(url);
		var options = this.getHttpOptions('GET', parsedUrl);

		return this.transport.transfer(parsedUrl, options).then(resp => {

			var newResp = this.checkStatusCodes(url, resp.statusCode, resp.headers);
			if (newResp)
				return newResp;

			return { url: url, data: resp.data };
		});
	}

	private parseUrl(url: string) {
		var parsedUrl = urls.parse(url);
		if (!parsedUrl.protocol || !parsedUrl.protocol.length) {
			parsedUrl.protocol = 'http:';
		}
		else if (parsedUrl.protocol !== 'http:' &&
			parsedUrl.protocol !== 'https:') {

			throw `Invalid url protocol to http get request: ${parsedUrl.protocol}`;
		}
		return parsedUrl;
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
	private checkStatusCodes(url: string, statusCode: number,
		headers: {}): Promise<IHttpResponse> {

		if (this.isInRange(statusCode, 200))
			return null;

		var location: string = (<any>headers).location;
		var redirectCodes = [300, 301, 307, 410];
		if (this.isValue(statusCode, redirectCodes) && location) {
			var newUrl = urls.resolve(url, location);
			if (newUrl !== url) {
				this.log.warn(`Received ${statusCode} from ${url}`);
				this.log.warn(`Going to new url  ${newUrl}`);
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
}
