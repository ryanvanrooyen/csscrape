
import { Url } from 'url';
import { IHttpMessage, IHttpTransport } from '../Source/httpTransport';

export class MockHttpTransport implements IHttpTransport {

	constructor(private mockTransfer: (url: Url, options: {}) => IHttpMessage) {
	}

	transfer(url: Url, options: {}): Promise<IHttpMessage> {
		try {
			var resp = this.mockTransfer(url, options);
			return Promise.resolve(resp);
		}
		catch (err) {
			return Promise.reject<IHttpMessage>(err);
		}
	}
}