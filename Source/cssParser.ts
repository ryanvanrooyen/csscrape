
import * as cheerio from 'cheerio';
import * as vm from 'vm';

export interface ICssParser {
	parse(selector: string): ISelectorDetails
}

export interface ISelectorDetails {
	selector: string;
	attrFilter: (el: Cheerio) => string;
	pseudoFilter: (el: Cheerio) => Cheerio;
}

export class CssParser implements ICssParser {

	public parse(selector: string): ISelectorDetails {

		var details: ISelectorDetails = {
			selector: selector || '',
			attrFilter: null,
			pseudoFilter: null
		};

		this.parseAttrFilter(details);
		this.parsePseudoFilter(details);

		details.selector = details.selector.trim();
		return details;
	}

	private parseAttrFilter(details: ISelectorDetails) {

		var attrFilters = ['~', '|', '^', '$', '*'];
		var attr, attrValue, attrFilter: string = null;

		var attrStartIndex = details.selector.indexOf('[');
		var attrEndIndex = details.selector.indexOf(']');
		if (attrStartIndex !== -1 && attrEndIndex !== -1) {
			attr = details.selector.substring(attrStartIndex + 1, attrEndIndex);
			details.selector = details.selector.substr(0, attrStartIndex) +
			details.selector.substr(attrEndIndex + 1);
		}

		if (attr) {
			var attrValueIndex = attr.indexOf('=');
			if (attrValueIndex !== -1) {
				attrValue = attr.substr(attrValueIndex + 1);
				attrValue = attrValue.replace(/["']/g, "");
				attr = attr.substr(0, attrValueIndex);

				var qualifier = attr.substr(attr.length - 1);
				var qualifierIndex = attrFilters.indexOf(qualifier);
				if (qualifierIndex !== -1) {
					attrFilter = qualifier;
					attr = attr.substr(0, attr.length - 1);
				}
			}
		}

		details.attrFilter = this.getAttrFilter(attr, attrValue, attrFilter);
	}

	private parsePseudoFilter(details: ISelectorDetails) {

		var pseudoSelector, param: string = null;

		var pseudoIndex = details.selector.indexOf(':');
		if (pseudoIndex !== -1) {
			pseudoSelector = details.selector.substring(pseudoIndex + 1);
			details.selector = details.selector.substr(0, pseudoIndex);
		}

		if (pseudoSelector) {
			var paramStartIndex = pseudoSelector.indexOf('(');
			var paramEndIndex = pseudoSelector.indexOf(')');
			if (paramStartIndex !== -1 && paramEndIndex !== -1) {
				param = pseudoSelector.substring(paramStartIndex + 1, paramEndIndex);
				pseudoSelector = pseudoSelector.substr(0, paramStartIndex);
			}
		}

		details.pseudoFilter = this.getPseudoFilter(pseudoSelector, param);
	}

	private getAttrFilter(attr: string, attrValue: string, attrFilter: string) {

		if (!attr)
			return null;

		attr = attr.trim().toLowerCase();
		if (attrValue)
			attrValue = attrValue.trim();

		if (!attrFilter && !attrValue) {
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal;
			}
		}
		if (!attrFilter && attrValue) {
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return attrValue === selectedVal ? el.text() : null;
			}
		}
		if (attrFilter === '^') {
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal && selectedVal.indexOf(attrValue) === 0 ? selectedVal : null;
			}
		}

		return null;
	}

	private getPseudoFilter(pseudoSelector: string, param: string) {

		if (!pseudoSelector)
			return null;

		pseudoSelector = pseudoSelector.trim().toLowerCase();

		if (param)
			param = param.trim();

		if (pseudoSelector === 'nth-child' && param) {
			return (el: Cheerio) => {
				var indexes = this.getSelectedIndexes(el.length, param);
				return el.filter(i => indexes.indexOf(i+1) !== -1);
			}
		}

		return null;
	}

	private getSelectedIndexes(length: number, param: string) {

		var arr = Array.apply(null, Array(length));
        var indexes = arr.map((x, i) => this.executExpression(i, param));

		return indexes.filter((x, i) => {
			var isOutOfRange = x < 0 || x >= length;
			if (isOutOfRange)
				return true;
			var alreadyExists = indexes.indexOf(x) === i;
			if (alreadyExists)
				return true;
		});
	}

	private executExpression(n: number, param: string) {
		try {
			var scope = { n: n };
			vm.runInNewContext('n = ' + param, scope);
			return scope.n;
		}
		catch(e) {
		}
		return -1;
	}
}