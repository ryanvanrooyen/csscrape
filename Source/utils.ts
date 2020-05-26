
import * as urls from 'url';
import * as cheerio from 'cheerio';


export function resolveURL(url: string, previousURL: string = null) {
	if (!url || !url.length)
		throw 'url could not be found';

	var parsedUrl = urls.parse(url);
	var isRelativeUrl = !parsedUrl.protocol || !parsedUrl.protocol.length;

	if (isRelativeUrl && !previousURL) {
		throw `url must be an absolute url: ${url}`;
	}
	else if (isRelativeUrl) {
		url = urls.resolve(previousURL, url);
	}
	return url;
}


export function parseHTML(url: string, html: string) {
	if (!html || !html.length) {
		throw 'received no html from url: ' + url;
	}
	try {
		return cheerio.load(html, {normalizeWhitespace: true});
	}
	catch (exc) {
		throw `unable to parse html from url ${url}: ${html}`;
	}
}


export function getTiming(start: Date) {
	var end = new Date();
	var ms = end.getTime() - start.getTime();
	var secs = ms / 1000;
	return secs;
}


export function endsWith(str: string, value: string) {
	str = (str || '').trim();
	var index = str.indexOf(value);
	return index !== -1 && index === str.length - value.length;
}


export function flatten<T>(values: T[][]) {
	return values.reduce((x, y) => x.concat(y), []);
}
