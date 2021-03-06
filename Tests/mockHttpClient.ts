
import { IHttpClient } from '../Source/httpClient';

export interface IMockHttpData {
	url: string;
	value: string;
}

export class MockHttpClient implements IHttpClient {

	constructor(private data: IMockHttpData[]) {
	}

	get(url: string) {
		var result = this.data
			.filter(d => d.url.toLowerCase() === url.toLowerCase())
			.map(d => d.value)[0];
		return Promise.resolve({ url: url, data: result });
	}
}