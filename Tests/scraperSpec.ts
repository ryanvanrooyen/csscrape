
import { Scraper } from '../Source/scraper';
import { NullLogger } from '../Source/logging';
import { MockHttpClient } from './mockHttpClient';
import { assert } from 'chai';

var url = 'http://test.io';


describe("Scraper", () => {

	it("can parse single string values", async () => {
		const values = await scrape(url)
			.select('dt')
			.done<string>();

		assert.lengthOf(values, 4);
		assert.equal(values[0], 'Entry: Item 1');
		assert.equal(values[1], 'Entry: Item 2');
		assert.equal(values[2], 'Entry: Item 3');
		assert.equal(values[3], 'Entry: Item 4');
	});

	it("can parse single string values 2", async () => {
		const values = await scrape(url)
			.select('dt a')
			.done<string>();

		assert.lengthOf(values, 4);
		assert.equal(values[0], 'Entry: Item 1');
		assert.equal(values[1], 'Entry: Item 2');
		assert.equal(values[2], 'Entry: Item 3');
		assert.equal(values[3], 'Entry: Item 4');
	});

	it("parse single string values 3", async () => {
		const values = await scrape(url)
			.select('dt a b')
			.done<string>();

		assert.lengthOf(values, 4);
		assert.equal(values[0], 'Entry:');
		assert.equal(values[1], 'Entry:');
		assert.equal(values[2], 'Entry:');
		assert.equal(values[3], 'Entry:');
	});

	it("can parse single object values", async () => {
		const values = await scrape(url)
			.select({title: 'dt'})
			.done();

		assert.lengthOf(values, 1);
		assert.propertyVal(values[0], 'title', 'Entry: Item 1');
	});

	it("can parse arrays of values", async () => {
		const values = await scrape(url)
			.select({'titles[]': 'dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		var value = values[0];
		assert.lengthOf(value.titles, 4);

		assert.equal(value.titles[0], 'Entry: Item 1');
		assert.equal(value.titles[1], 'Entry: Item 2');
		assert.equal(value.titles[2], 'Entry: Item 3');
		assert.equal(value.titles[3], 'Entry: Item 4');
	});

	it("can filter by classes", async () => {
		const values = await scrape(url)
			.filter('.results')
			.select({'titles[]': 'dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		var value = values[0];
		assert.lengthOf(value.titles, 3);

		assert.equal(value.titles[0], 'Entry: Item 2');
		assert.equal(value.titles[1], 'Entry: Item 3');
		assert.equal(value.titles[2], 'Entry: Item 4');
	});

	it("can filter by classes and tags 1", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({title: 'dt'})
			.done();

		assert.lengthOf(values, 3);
		assert.propertyVal(values[0], 'title', 'Entry: Item 2');
		assert.propertyVal(values[1], 'title', 'Entry: Item 3');
		assert.propertyVal(values[2], 'title', 'Entry: Item 4');
	});

	it("can filter by classes and tags 2", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'titles[]': 'dt'})
			.done<any>();

		assert.lengthOf(values, 3);
		assert.lengthOf(values[0].titles, 1);
		assert.equal(values[0].titles[0], 'Entry: Item 2');
		assert.lengthOf(values[1].titles, 1);
		assert.equal(values[1].titles[0], 'Entry: Item 3');
		assert.lengthOf(values[2].titles, 1);
		assert.equal(values[2].titles[0], 'Entry: Item 4');
	});

	it("can filter by classes and tags 3", async () => {
		const values = await scrape(url)
			.select({title: 'dl dt a'})
			.filter('.results dl')
			.select({'names[]': 'dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		assert.lengthOf(values[0].names, 3);
		assert.propertyVal(values[0], 'title', 'Entry: Item 1');

		assert.equal(values[0].names[0], 'Entry: Item 2');
		assert.equal(values[0].names[1], 'Entry: Item 3');
		assert.equal(values[0].names[2], 'Entry: Item 4');
	});

	it("can follow links 1", async () => {
		const values = await scrape(url)
			.select({title: 'dt'})
			.follow('.results dl dt a')
			.select({'details[]': '.details dl span[title]'})
			.done<any>();

		assert.lengthOf(values, 1);
		assert.equal(values[0].title, 'Entry: Item 1');

		assert.lengthOf(values[0].details, 6);
		assert.equal(values[0].details[0], 'Details info description 2');
		assert.equal(values[0].details[1], 'Details info description 3');
		assert.equal(values[0].details[2], 'Details info description 2');
		assert.equal(values[0].details[3], 'Details info description 3');
		assert.equal(values[0].details[4], 'Details info description 2');
		assert.equal(values[0].details[5], 'Details info description 3');
	});

	it("can follow links 2", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({title: 'dt'})
			.follow('dt a')
			.select({'details[]': '.details dl span[title]'})
			.done<any>();

		assert.lengthOf(values, 3);

		assert.equal(values[0].title, 'Entry: Item 2');
		assert.lengthOf(values[0].details, 2);
		assert.equal(values[0].details[0], 'Details info description 2');
		assert.equal(values[0].details[1], 'Details info description 3');

		assert.equal(values[1].title, 'Entry: Item 3');
		assert.lengthOf(values[1].details, 2);
		assert.equal(values[1].details[0], 'Details info description 2');
		assert.equal(values[1].details[1], 'Details info description 3');

		assert.equal(values[2].title, 'Entry: Item 4');
		assert.lengthOf(values[2].details, 2);
		assert.equal(values[2].details[0], 'Details info description 2');
		assert.equal(values[2].details[1], 'Details info description 3');
	});

	it("can select attributes 1", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select(['dd span', 'title'])
			.done<any>();

		assert.lengthOf(values, 3);
		assert.equal(values[0], 'C2 Title');
		assert.equal(values[1], 'C3 Title');
		assert.equal(values[2], 'C4 Title');
	});

	it("can select attributes 2", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({
				info: ['dd span', 'title']
			})
			.follow('dt a')
			.select({
				desc: ['dl:nth-child(2) span', 'title'],
				href: ['dl:nth-child(2) a', 'href']
			})
			.done<any>();

		assert.lengthOf(values, 3);
		assert.equal(values[0].info, 'C2 Title');
		assert.equal(values[0].desc, 'Desc Title 2');
		assert.equal(values[0].href, 'http://moreinfo.io/evenmoreinfo');
		assert.equal(values[1].info, 'C3 Title');
		assert.equal(values[1].desc, 'Desc Title 2');
		assert.equal(values[1].href, 'http://moreinfo.io/evenmoreinfo');
		assert.equal(values[2].info, 'C4 Title');
		assert.equal(values[2].desc, 'Desc Title 2');
		assert.equal(values[2].href, 'http://moreinfo.io/evenmoreinfo');
	});

	it("can select attributes by value - ^ starting with (with quotes)", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'info' : 'dd span[testAttr^="attr"]'})
			.done<any>();

		assert.lengthOf(values, 3);
		assert.propertyVal(values[0], 'info', 'D2E2');
		assert.propertyVal(values[1], 'info', 'D3E3');
		assert.propertyVal(values[2], 'info', 'D4E4');
	});

	it("can select attributes by value - ^ starting with (without quotes)", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'info' : ['dd span[testAttr^=attr]', 'testAttr']})
			.done();

		assert.lengthOf(values, 3);
		assert.propertyVal(values[0], 'info', 'attr2');
		assert.propertyVal(values[1], 'info', 'attr3');
		assert.propertyVal(values[2], 'info', 'attr4');
	});

	it("can select elements with attribute values (with quotes)", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'info': 'dd span[testAttr="attr3"]'})
			.done();

		assert.lengthOf(values, 1);
		assert.propertyVal(values[0], 'info', 'D3E3');
	});

	it("can select elements with attribute values (without quotes)", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'info': 'dd span[testAttr=attr3]'})
			.done();

		assert.lengthOf(values, 1);
		assert.propertyVal(values[0], 'info', 'D3E3');
	});

	it("can select multiple properties", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({
				'title': 'a',
				'prop1': '.a',
				'prop2': '.a .b',
				'prop3': '.d span',
				'prop4': '.doesntExist',
				'prop5[]': '.doesntExist'
			})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.propertyVal(value, 'prop1', 'A2B2C2');
		assert.propertyVal(value, 'prop2', 'B2C2');
		assert.propertyVal(value, 'prop3', 'E2');
		assert.propertyVal(value, 'prop4', null);
		assert.isArray(value.prop5);
		assert.equal(value.prop5.length, 0);

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.propertyVal(value, 'prop1', 'A3B3C3');
		assert.propertyVal(value, 'prop2', 'B3C3');
		assert.propertyVal(value, 'prop3', 'E3');
		assert.propertyVal(value, 'prop4', null);
		assert.isArray(value.prop5);
		assert.equal(value.prop5.length, 0);

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.propertyVal(value, 'prop1', 'A4B4C4');
		assert.propertyVal(value, 'prop2', 'B4C4');
		assert.propertyVal(value, 'prop3', 'E4');
		assert.propertyVal(value, 'prop4', null);
		assert.isArray(value.prop5);
		assert.equal(value.prop5.length, 0);
	});

	it("can group properties", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({
				'title' : 'dt',
				'info' : {
					'prop1': '.a',
					'prop2': '.a .b',
					'prop3': '.d span'
				}
			})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.propertyVal(value.info, 'prop1', 'A2B2C2');
		assert.propertyVal(value.info, 'prop2', 'B2C2');
		assert.propertyVal(value.info, 'prop3', 'E2');

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.propertyVal(value.info, 'prop1', 'A3B3C3');
		assert.propertyVal(value.info, 'prop2', 'B3C3');
		assert.propertyVal(value.info, 'prop3', 'E3');

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.propertyVal(value.info, 'prop1', 'A4B4C4');
		assert.propertyVal(value.info, 'prop2', 'B4C4');
		assert.propertyVal(value.info, 'prop3', 'E4');
	});

	it("can use pseudo selectors to select values nth-child(1)", async () => {
		const values = await scrape(url)
			.select({'titles[]': '.results dl:nth-child(1) dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		var value = values[0];
		assert.lengthOf(value.titles, 1);
		assert.equal(value.titles[0], 'Entry: Item 2');
	});

	it("can use pseudo selectors to select values nth-child(2n+1)", async () => {
		const values = await scrape(url)
			.select({'titles[]': '.results dl:nth-child(2n+1) dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		var value = values[0];
		assert.lengthOf(value.titles, 2);
		assert.equal(value.titles[0], 'Entry: Item 2');
		assert.equal(value.titles[1], 'Entry: Item 4');
	});

	it("can use pseudo selectors to select values nth-child(-n+3)", async () => {
		const values = await scrape(url)
			.select({'titles[]': '.results dl:nth-child(-n+3) dt'})
			.done<any>();

		assert.lengthOf(values, 1);
		var value = values[0];
		assert.lengthOf(value.titles, 3);
		assert.equal(value.titles[0], 'Entry: Item 2');
		assert.equal(value.titles[1], 'Entry: Item 3');
		assert.equal(value.titles[2], 'Entry: Item 4');
	});

	it("can use pseudo selectors to filter (nth-child(2))", async () => {
		const values = await scrape(url)
			.filter('.results dl:nth-child(2)')
			.select('dt')
			.done();

		assert.lengthOf(values, 1);
		assert.equal(values[0], 'Entry: Item 3');
	});

	it("can use pseudo selectors to filter nth-child(2n)", async () => {
		const values = await scrape(url)
			.filter('.results dl:nth-child(2n)')
			.select('dt')
			.done();

		assert.lengthOf(values, 1);
		assert.equal(values[0], 'Entry: Item 3');
	});

	it("can use pseudo selectors to filter nth-child(-n+2)", async () => {
		const values = await scrape(url)
			.filter('.results dl:nth-child(-n+2)')
			.select('dt')
			.done();

		assert.lengthOf(values, 2);
		assert.equal(values[0], 'Entry: Item 2');
		assert.equal(values[1], 'Entry: Item 3');
	});

	it("can follow absolute links", async () => {
		await runFollowLinksTest(false);
	});

	it("can follow relative links", async () => {
		await runFollowLinksTest(true);
	});

	var runFollowLinksTest = async function(useRelativeLinks: boolean) {
		const values = await scrape(url, useRelativeLinks)
			.filter('.results dl')
			.select({title: 'dt'})
			.follow('dt > a')
			.select({'details[]': {'name': '.details > dl dd span'}})
			.select({extraInfo: 'h2'})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.propertyVal(value, 'extraInfo', 'Details list header');

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.propertyVal(value, 'extraInfo', 'Details list header');

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.propertyVal(value, 'extraInfo', 'Details list header');
	}

	it("it can parse properties as arrays 1", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'title': 'dt'})
			.follow('dt > a')
			.select({'details[]': '.details > dl dd span'})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.lengthOf(value.details, 2);
		assert.equal(value.details[0], 'Details info description 2')
		assert.equal(value.details[1], 'Details info description 3')

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.lengthOf(value.details, 2);
		assert.equal(value.details[0], 'Details info description 2')
		assert.equal(value.details[1], 'Details info description 3')

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.lengthOf(value.details, 2);
		assert.equal(value.details[0], 'Details info description 2')
		assert.equal(value.details[1], 'Details info description 3')
	});

	it("it can parse properties as arrays 2", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'title': 'dt'})
			.follow('dt > a')
			.select({'details[]': {'name': '.details > dl dd span'}})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
	});

	it("it can parse properties as arrays 3", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'title': 'dt'})
			.follow('dt > a')
			.filter('.details > dl')
			.select({'details[]': {'name': 'dd span'}})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
	});

	it("it can parse properties as arrays 4", async () => {
		const values = await scrape(url)
			.filter('.results dl')
			.select({'title': 'dt'})
			.follow('dt > a')
			.filter('.details > dl')
			.select({'details[]': {'name': 'dd span'}})
			.follow('a')
			.select({'extraInfo[]': 'div'})
			.done<any>();

		assert.lengthOf(values, 3);

		var value = values[0];
		assert.propertyVal(value, 'title', 'Entry: Item 2');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.lengthOf(value.extraInfo, 2);

		var value = values[1];
		assert.propertyVal(value, 'title', 'Entry: Item 3');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.lengthOf(value.extraInfo, 2);

		var value = values[2];
		assert.propertyVal(value, 'title', 'Entry: Item 4');
		assert.lengthOf(value.details, 2);
		assert.propertyVal(value.details[0], 'name', 'Details info description 2');
		assert.propertyVal(value.details[1], 'name', 'Details info description 3');
		assert.lengthOf(value.extraInfo, 2);
	});
});


function scrape(url: string, useRelativeLinks = false) {

	var moreInfoHost = 'http://moreinfo.io';
	var detailsUrl = moreInfoHost + '/details';
	var furtherDetailsAbsUrl = moreInfoHost + '/evenmoreinfo';
	var furtherDetailsUrl = useRelativeLinks ? '/evenmoreinfo' : furtherDetailsAbsUrl;

	var html = `
		<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 1</a></dt>
			<dd><span class="a">A1<span class="b">B1<span title="C1 Title">C1</span></span></span>
				<span class="d" testAttr="attr1">D1<span class="e">E1</span></span></dd>
		</dl>
		<div class="results">
			<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 2</a></dt>
				<dd><span class="a">A2<span class="b">B2<span title="C2 Title">C2</span></span></span>
					<span class="d" testAttr="attr2">D2<span class="e">E2</span></span></dd>
			</dl>
			<dl><dt><a HRef="${detailsUrl}"><b>Entry:</b> Item 3</a></dt>
				<dd><span class="a">A3<span class="b">B3<span title="C3 Title">C3</span></span></span>
					<span class="d" testAttr="attr3">D3<span class="e">E3</span></span></dd>
			</dl>
			<dl><dt><a HREF="${detailsUrl}"><b>Entry:</b> Item 4</a></dt>
				<dd><span class="a">A4<span class="b">B4<span title="C4 Title">C4</span></span></span>
					<span class="d" testAttr="attr4">D4<span class="e">E4</span></span></dd>
			</dl>
		</div>`;

	var detailsHtml = `
		<dl><dt><a href="${furtherDetailsUrl}">Entry Details Info 1</a></dt>
			<dd><span title="Desc Title 1">Details info description 1</span></dd>
		</dl>
		<div class="details">
			<h2>Details list header</h2>
			<dl><dt><a href="${furtherDetailsUrl}">Entry Details Info 2</a></dt>
				<dd><span title="Desc Title 2">Details info description 2</span></dd>
			</dl>
			<dl><dt><a href="${furtherDetailsUrl}">Entry Details Info 3</a></dt>
				<dd><span title="Desc Title 3">Details info description 3</span></dd>
			</dl>
		</div>`;

	var furtherDetailsHtml = `
		<div>Futher Details Information</div>`;

	var httpClient = new MockHttpClient([
		{ url: url, value: html },
		{ url: detailsUrl, value: detailsHtml },
		{ url: furtherDetailsAbsUrl, value: furtherDetailsHtml }
	]);

	const scraper = new Scraper(new NullLogger(), httpClient);
	return scraper.get(url);
}
