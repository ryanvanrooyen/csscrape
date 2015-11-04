
import * as cheerio from 'cheerio';

export interface ICssParser {
	parse(selector: string): ISelectorDetails
}

export interface ISelectorDetails {
	selector: string;
	attr: string;
	attrFilter: (el: Cheerio) => string;
	pseudoSelector: string;
}

export class CssParser implements ICssParser {

	public parse(selector: string): ISelectorDetails {

		var details: ISelectorDetails = {
			selector: selector || '',
			attr: null,
			attrFilter: null,
			pseudoSelector: null
		};

		details = this.parseAttr(details);
		return details;
	}


	private parseAttr(details: ISelectorDetails): ISelectorDetails {

		var attrFilters = ['~', '|', '^', '$', '*'];
		var attrValue, attrFilter: string = null;

		var attrStartIndex = details.selector.indexOf('[');
		var attrEndIndex = details.selector.indexOf(']');
		if (attrStartIndex !== -1 && attrEndIndex !== -1) {
			details.attr = details.selector.substring(attrStartIndex + 1, attrEndIndex);
			details.selector = details.selector.substr(0, attrStartIndex);
		}

		if (details.attr) {
			var attrValueIndex = details.attr.indexOf('=');
			if (attrValueIndex !== -1) {
				attrValue = details.attr.substr(attrValueIndex + 1);
				attrValue = attrValue.replace(/["']/g, "");
				details.attr = details.attr.substr(0, attrValueIndex);

				var qualifier = details.attr.substr(details.attr.length - 1);
				var qualifierIndex = attrFilters.indexOf(qualifier);
				if (qualifierIndex !== -1) {
					attrFilter = qualifier;
					details.attr = details.attr.substr(0, details.attr.length - 1);
				}
			}
		}

		details.attrFilter = this.getAttrFilter(
			details.attr, attrValue, attrFilter);

		return details;
	}

	private getAttrFilter(attr: string, attrValue: string, attrFilter: string) {

		if (!attr)
			return null;

		attr = attr.toLowerCase();

		if (!attrFilter && !attrValue)
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal;
			}
		if (!attrFilter && attrValue)
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return attrValue === selectedVal ? el.text() : null;
			}
		if (attrFilter === '^')
			return (el: Cheerio) => {
				var selectedVal = el.attr(attr);
				return selectedVal && selectedVal.indexOf(attrValue) === 0 ? selectedVal : null;
			}

		return null;
	}
}