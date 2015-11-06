
import * as http from 'http';
import * as https from 'https';
import { Url } from 'url';

export interface IHttpTransport {
	transfer(url: Url, options: {}): Promise<IHttpMessage>;
}

export interface IHttpMessage {
	data: string;
	statusCode: number;
	headers: {}
}

export class HttpTransport implements IHttpTransport {

	transfer(url: Url, options: {}): Promise<IHttpMessage> {

		return new Promise<IHttpMessage>((resolve, reject) => {

			var httpModule = url.protocol === 'https:' ? https : http;
			var req = httpModule.request(options, resp => {

				// Continuously update stream with data
				//resp.setEncoding('utf8');
				var body = '';
				resp.on('data', d => body += d);
				resp.on('end', () => resolve({
					data: body,
					statusCode: resp.statusCode,
					headers: resp.headers
				}));
			});

			req.on('error', err => reject(err.message));
			req.end();
		});
	}
}
