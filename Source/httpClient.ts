
import * as urls from 'url';
import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';
import { ILogger, NullLogger } from './logging';

export interface IHttpClient {
	get(url: string, query?: {}): Promise<IHttpResponse>;
}

export interface IHttpResponse {
	url: string,
	data: string
}

export class HttpClient implements IHttpClient {

	constructor(private log: ILogger = new NullLogger()) {
	}

	get(url: string, query?: {}): Promise<IHttpResponse> {

		if (!url || !url.length)
			return Promise.reject<IHttpResponse>('No url specified to http get.');
		if (query)
			url += '?' + querystring.stringify(query);

		var parsedUrl = urls.parse(url);
		if (parsedUrl.protocol !== 'http:' &&
			parsedUrl.protocol !== 'https:') {

			return Promise.reject<IHttpResponse>(
				'Invalid url protocol to http get request: ' + parsedUrl.protocol);
		}

		var options = this.getHttpOptions('GET', parsedUrl);
		var httpModule = parsedUrl.protocol === 'https:' ? https : http;

		return new Promise<IHttpResponse>((resolve, reject) => {
			var req = httpModule.request(options, resp => {

				if (this.handleStatusCodes(resp, url, parsedUrl, resolve, reject))
					return;

				// Continuously update stream with data
				//resp.setEncoding('utf8');
				var body = '';
				resp.on('data', d => body += d);
				resp.on('end', () => resolve({ url: url, data: body }));
			});

			req.on('error', err => reject(err.message));
			req.end();
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

	// Returns true if response processing should not continue.
	private handleStatusCodes(resp: http.IncomingMessage,
		url: string, parsedUrl: urls.Url,
		resolve: (data: any) => void, reject: (data: any) => void) {

		var statusCode = resp.statusCode;
		if (this.isInRange(statusCode, 200))
			return false;

		var redirectCodes = [300, 301, 307, 410];
		if (this.isValue(statusCode, redirectCodes) && resp.headers.location) {
			var newUrlPath = <string>resp.headers.location;
			var newUrl = urls.resolve(url, newUrlPath);
			if (newUrl !== url) {
				this.log.info(`Received ${statusCode} from ${url}`);
				this.log.info(`Going to new url  ${newUrl}`);
				resolve(this.get(newUrl));
				return true;
			}
		}

		if (!this.isInRange(statusCode, 200)) {
			this.log.error(`Received status code ${statusCode} for url ${url} with headers:`);
			this.log.error(resp.headers);
			reject(`Received status code ${statusCode} for url ${url}`);
			return true;
		}

		return false;
	}

	private isInRange(value: number, numb: number) {
		return value >= numb && value < (numb + 100);
	}

	private isValue(value: number, numbs: number[]) {
		return numbs.some(n => value === n);
	}
}
