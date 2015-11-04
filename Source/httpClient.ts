
import * as request from 'request';

export interface IHttpClient {
	get(url: string, query?: {}): Promise<string>;
}

export class HttpClient implements IHttpClient {

	get(url: string, query?: {}): Promise<string> {

		// Set the headers
		var headers: any = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36'
			//'Content-Type': 'application/x-www-form-urlencoded'
		}

		var options = { method: 'GET', headers: headers, url: url, qs: query };

		return new Promise<string>((resolve, reject) => {
			request(options, (error, response, body) => {
				if (!error && response.statusCode == 200)
					resolve(body);
				else
					reject(error || response.statusCode)
			})
		});
	}
}
