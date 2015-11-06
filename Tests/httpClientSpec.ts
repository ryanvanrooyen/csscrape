
import { HttpClient } from '../Source/httpClient';
import { NullLogger } from '../Source/logging';
import { MockHttpTransport } from './mockHttpTransport';
import { assert } from 'chai';

describe("HttpClient", () => {

	it("will assume http:// if no protocol specified", () => {

		var testUrl = 'www.testHostName.com/path/blah';
		var transport = new MockHttpTransport((url, options) => {
			assert.equal(url.protocol, 'http:');
			assert.equal(url.host, 'www.testhostname.com');
			assert.equal(url.path, '/path/blah');
			return { data: '', statusCode: 200, headers: {} };
		});

		var client = new HttpClient(new NullLogger(), transport);
		client.get(testUrl);
	});
});