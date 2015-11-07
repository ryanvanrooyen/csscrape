
import { WebScraper } from '../Source/webScraper';
import { NullLogger } from '../Source/logging';
import { MockHttpClient } from './mockHttpClient';
import { assert } from 'chai';

var url = 'http://test.io';

describe("WebScraper", () => {

	it("can parse single string values", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select('dt')
			.done<string>().then(values => {

				assert.lengthOf(values, 4);
				assert.equal(values[0], 'Entry: Item 1');
				assert.equal(values[1], 'Entry: Item 2');
				assert.equal(values[2], 'Entry: Item 3');
				assert.equal(values[3], 'Entry: Item 4');
			})
			.then(done, done);
	});

	it("can parse single object values", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select({'title': 'dt'})
			.done().then(values => {

				assert.lengthOf(values, 1);
				assert.propertyVal(values[0], 'title', 'Entry: Item 1');
			})
			.then(done, done);
	});

	it("can parse arrays of values", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select({'titles[]': 'dt'})
			.done<any>().then(values => {

				assert.lengthOf(values, 1);
				var value = values[0];
				assert.lengthOf(value.titles, 4);

				assert.equal(value.titles[0], 'Entry: Item 1');
				assert.equal(value.titles[1], 'Entry: Item 2');
				assert.equal(value.titles[2], 'Entry: Item 3');
				assert.equal(value.titles[3], 'Entry: Item 4');
			})
			.then(done, done);
	});

	it("can filter by classes", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results')
			.select({'titles[]': 'dt'})
			.done<any>().then(values => {

				assert.lengthOf(values, 1);
				var value = values[0];
				assert.lengthOf(value.titles, 3);

				assert.equal(value.titles[0], 'Entry: Item 2');
				assert.equal(value.titles[1], 'Entry: Item 3');
				assert.equal(value.titles[2], 'Entry: Item 4');
			})
			.then(done, done);
	});

	it("can filter by classes and tags", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({'title': 'dt'})
			.done().then(values => {

				assert.lengthOf(values, 3);

				assert.propertyVal(values[0], 'title', 'Entry: Item 2');
				assert.propertyVal(values[1], 'title', 'Entry: Item 3');
				assert.propertyVal(values[2], 'title', 'Entry: Item 4');
			})
			.then(done, done);
	});

	it("can select attributes", done => {
		var scraper = createScraper(true);

		scraper.get(url, {})
			.filter('.results dl')
			.select({
				info: 'dd span[title]'
			})
			.follow('dt a')
			.select({
				href: 'a[href]:nth-child(2)'
			})
			.done<any>().then(values => {

				assert.lengthOf(values, 3);
				assert.equal(values[0].info, 'C2 Title');
				assert.equal(values[0].href, 'http://moreinfo.io/evenmoreinfo');
				assert.equal(values[1].info, 'C3 Title');
				assert.equal(values[1].href, 'http://moreinfo.io/evenmoreinfo');
				assert.equal(values[2].info, 'C4 Title');
				assert.equal(values[2].href, 'http://moreinfo.io/evenmoreinfo');
			})
			.then(done, done);
	});

	it("can select attributes by value - ^ starting with (with quotes)", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({'info' : 'dd span[testAttr^="attr"]'})
			.done<any>().then(values => {

				assert.lengthOf(values, 3);
				assert.propertyVal(values[0], 'info', 'attr2');
				assert.propertyVal(values[1], 'info', 'attr3');
				assert.propertyVal(values[2], 'info', 'attr4');
			})
			.then(done, done);
	});

	it("can select attributes by value - ^ starting with (without quotes)", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({'info' : 'dd span[testAttr^=attr]'})
			.done().then(values => {

				assert.lengthOf(values, 3);
				assert.propertyVal(values[0], 'info', 'attr2');
				assert.propertyVal(values[1], 'info', 'attr3');
				assert.propertyVal(values[2], 'info', 'attr4');
			})
			.then(done, done);
	});

	it("can select elements with attribute values (with quotes)", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({'info': 'dd span[testAttr="attr3"]'})
			.done().then(values => {

				assert.lengthOf(values, 1);
				assert.propertyVal(values[0], 'info', 'D3E3');
			})
			.then(done, done);
	});

	it("can select elements with attribute values (without quotes)", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({'info': 'dd span[testAttr=attr3]'})
			.done().then(values => {

				assert.lengthOf(values, 1);
				assert.propertyVal(values[0], 'info', 'D3E3');
			})
			.then(done, done);
	});

	it("can select multiple properties", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({
				'title': 'a',
				'prop1': '.a',
				'prop2': '.a .b',
				'prop3': '.d span',
				'prop4': '.doesntExist',
				'prop5[]': '.doesntExist'
			})
			.done<any>().then(values => {

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
			})
			.then(done, done);
	});

	it("can group properties", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl')
			.select({
				'title' : 'dt',
				'info' : {
					'prop1': '.a',
					'prop2': '.a .b',
					'prop3': '.d span'
				}
			})
			.done<any>().then(values => {

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
			})
			.then(done, done);
	});

	it("can use pseudo selectors to select values (nth-child(1))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select({'titles[]': 'dt:nth-child(1)'})
			.done<any>().then(values => {

				assert.lengthOf(values, 1);
				var value = values[0];
				assert.lengthOf(value.titles, 1);
				assert.equal(value.titles[0], 'Entry: Item 1');
			})
			.then(done, done);
	});

	it("can use pseudo selectors to select values (nth-child(2*n+1))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select({'titles[]': 'dt:nth-child(2*n+1)'})
			.done<any>().then(values => {

				assert.lengthOf(values, 1);
				var value = values[0];
				assert.lengthOf(value.titles, 2);
				assert.equal(value.titles[0], 'Entry: Item 1');
				assert.equal(value.titles[1], 'Entry: Item 3');
			})
			.then(done, done);
	});

	it("can use pseudo selectors to select values (nth-child(-n+3))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.select({'titles[]': 'dt:nth-child(-n+3)'})
			.done<any>().then(values => {

				assert.lengthOf(values, 1);
				var value = values[0];
				assert.lengthOf(value.titles, 3);
				assert.equal(value.titles[0], 'Entry: Item 1');
				assert.equal(value.titles[1], 'Entry: Item 2');
				assert.equal(value.titles[2], 'Entry: Item 3');
			})
			.then(done, done);
	});

	it("can use pseudo selectors to filter (nth-child(2))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('dl:nth-child(2)')
			.select('dt')
			.done().then(values => {
				assert.lengthOf(values, 1);
				assert.equal(values[0], 'Entry: Item 2');
			})
			.then(done, done);
	});

	it("can use pseudo selectors to filter (nth-child(2*n))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('dl:nth-child(2*n)')
			.select('dt')
			.done().then(values => {
				assert.lengthOf(values, 2);
				assert.equal(values[0], 'Entry: Item 2');
				assert.equal(values[1], 'Entry: Item 4');
			})
			.then(done, done);
	});

	it("can use pseudo selectors to filter (nth-child(-n+2))", done => {
		var scraper = createScraper();

		scraper.get(url, {})
			.filter('.results dl:nth-child(-n+2)')
			.select('dt')
			.done().then(values => {
				assert.lengthOf(values, 2);
				assert.equal(values[0], 'Entry: Item 2');
				assert.equal(values[1], 'Entry: Item 3');
			})
			.then(done, done);
	});

	it("can follow absolute links", done => {
		var scraper = createScraper();
		runFollowLinksTest(scraper, done);
	});

	it("can follow relative links", done => {
		var scraper = createScraper(true);
		runFollowLinksTest(scraper, done);
	});

	var runFollowLinksTest = function(scraper: WebScraper, done: () => void) {

		scraper.get(url, {})
			.filter('.results dl')
			.select({'title': 'dt',})
			.follow('dt > a')
			.filter('.details > dl')
			.select({'details[]': {'name': 'dt'}})
			.follow('a')
			.select({'extraInfo[]': 'div'})
			.done<any>().then(values => {

				assert.lengthOf(values, 3);

				var value = values[0];
				assert.propertyVal(value, 'title', 'Entry: Item 2');
				assert.lengthOf(value.details, 2);
				assert.propertyVal(value.details[0], 'name', 'Entry Details Info 2');
				assert.propertyVal(value.details[1], 'name', 'Entry Details Info 3');
				assert.lengthOf(value.extraInfo, 2);

				var value = values[1];
				assert.propertyVal(value, 'title', 'Entry: Item 3');
				assert.lengthOf(value.details, 2);
				assert.propertyVal(value.details[0], 'name', 'Entry Details Info 2');
				assert.propertyVal(value.details[1], 'name', 'Entry Details Info 3');
				assert.lengthOf(value.extraInfo, 2);

				var value = values[2];
				assert.propertyVal(value, 'title', 'Entry: Item 4');
				assert.lengthOf(value.details, 2);
				assert.propertyVal(value.details[0], 'name', 'Entry Details Info 2');
				assert.propertyVal(value.details[1], 'name', 'Entry Details Info 3');
				assert.lengthOf(value.extraInfo, 2);
			})
			.then(done, done);
	}


});


function createScraper(useRelativeLinks = false) {

	var moreInfoHost = 'http://moreinfo.io';
	var detailsUrl = moreInfoHost + '/details';
	var furtherDetailsAbsUrl = moreInfoHost + '/evenmoreinfo';
	var furtherDetailsUrl = useRelativeLinks ? '/evenmoreinfo' : furtherDetailsAbsUrl;

	var html = `
		<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 1</a></dt>
			<dd><span class="a">A1<span class="b">B1<span title="C1 Title">C1</span></span></span>
				<span class="d" testAttr="attr1">D1<span class="e">E1</span></dd></span>
		</dl>
		<div class="results">
			<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 2</a></dt>
				<dd><span class="a">A2<span class="b">B2<span title="C2 Title">C2</span></span></span>
					<span class="d" testAttr="attr2">D2<span class="e">E2</span></dd></span>
			</dl>
			<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 3</a></dt>
				<dd><span class="a">A3<span class="b">B3<span title="C3 Title">C3</span></span></span>
					<span class="d" testAttr="attr3">D3<span class="e">E3</span></dd></span>
			</dl>
			<dl><dt><a href="${detailsUrl}"><b>Entry:</b> Item 4</a></dt>
				<dd><span class="a">A4<span class="b">B4<span title="C4 Title">C4</span></span></span>
					<span class="d" testAttr="attr4">D4<span class="e">E4</span></dd></span>
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

	return new WebScraper(new NullLogger(), httpClient);
}
