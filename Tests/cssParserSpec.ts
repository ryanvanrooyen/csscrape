
import * as cheerio from 'cheerio';
import { CssParser, ISelectorDetails } from '../Source/cssParser';
import { assert } from 'chai';

describe("CssParser - can parse", () => {

	var attrSelectors = [
		'.a[href]'
	];

	run('an attribute selector', attrSelectors, result => {
		assert.equal(result.selector, '.a');
		assert.equal(result.attr, 'href');
		assert.equal(result.pseudoSelector, null);

		var root = cheerio.load('<div class="a" href="/test">Item</div>').root();
		var el = root.children();
		var selectedValue = result.attrFilter(el);
		assert.equal(selectedValue, '/test');
	});


});

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