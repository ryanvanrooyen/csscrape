
import * as cheerio from 'cheerio';
import { CssParser, ISelectorDetails } from '../Source/cssParser';
import { assert } from 'chai';

describe("CssParser - can parse", () => {

	var attrSelectors = [
		'.a[href]',
		'  .a[href] ',
		'.a [ href]',
		'.a[href ] ',
		' .a  [ href ] '
	];

	run('attribute selectors', attrSelectors, result => {
		assert.equal(result.selector, '.a');
		assert.equal(result.pseudoFilter, null);

		var el = getElement('<div class="a" href="/test">Item</div>');
		var selectedValue = result.attrFilter(el);
		assert.equal(selectedValue, '/test');
	});

	var attrEqualSelectors = [
		'.a[href=/test]',
		' .a[href="/test"]',
		'  .a[href = "/test"] ',
		'.a [ href =  /test ]',
		'.a[href = "/test" ] ',
		'.a[href = " /test " ] ',
	];

	run('attribute value equals selectors', attrEqualSelectors, result => {
		assert.equal(result.selector, '.a');
		assert.equal(result.pseudoFilter, null);

		var el = getElement('<div class="a" href="/test">Item</div>');
		var selectedValue = result.attrFilter(el);
		assert.equal(selectedValue, 'Item');
	});

	var startsWithSelectors = [
		'.a[href^=/te]',
		' .a[href^="/te"]',
		'  .a[href ^= "/t"] ',
		'.a [ href ^=  /tes ]',
		'.a[href ^= "/test" ] ',
		'.a[href ^= " /tes " ] ',
	];

	run('attribute value starts with (^) selectors', startsWithSelectors, result => {
		assert.equal(result.selector, '.a');
		assert.equal(result.pseudoFilter, null);

		var el = getElement('<div class="a" href="/test">Item</div>');
		var selectedValue = result.attrFilter(el);
		assert.equal(selectedValue, '/test');
	});

	var nthChildSelector = [
		'.a:nth-child(2)',
		'.a : nth-child(2) ',
		'.a : nth-child( 2)',
		'.a : nth-child( 2 )',
		' .a :  nth-child( 2 ) ',
	];

	run('pseudo :nth-child(n) selectors (n=2)', nthChildSelector, result => {
		assert.equal(result.selector, '.a');
		assert.equal(result.attrFilter, null);

		var el = getElement(
			'<div class="a" href="/test">Item1</div>' +
			'<div class="a" href="/test">Item2</div>' +
			'<div class="a" href="/test">Item3</div>');

		var selectedEl = result.pseudoFilter(el);
		var selectedValue = selectedEl.text();
		assert.equal(selectedValue, 'Item2');
	});
});

function getElement(html: string) {
	var root = cheerio.load(html).root();
	return root.children();
}

function run(testName: string, selectors: string[],
	assert: (details: ISelectorDetails) => void) {

	var parser = new CssParser();
	selectors.forEach(selector => {

		it(testName + ": '" + selector + "'", () => {
			var details = parser.parse(selector);
			assert(details);
		});
	});
}

function only(testName: string, selectors: string[],
	assert: (details: ISelectorDetails) => void) {

	var parser = new CssParser();
	selectors.forEach(selector => {

		it.only(testName + ": '" + selector + "'", () => {
			var details = parser.parse(selector);
			assert(details);
		});
	});
}