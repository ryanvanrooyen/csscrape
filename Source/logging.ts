
import * as util from 'util';

export interface ILogger {
	info(data: any, ...moreData: any[]): void;
	error(data: any, ...moreData: any[]): void;
}

export class NullLogger implements ILogger {
	info(data: any, ...moreData: any[]) {
	}
	error(data: any, ...moreData: any[]) {
	}
}

export class ConsoleLogger implements ILogger {

	info(data: any, ...moreData: any[]) {
		this.logData(data);
		moreData.forEach(d => this.logData(data));
	}

	error(data: any, ...moreData: any[]) {
		this.logData(data);
		moreData.forEach(d => this.logData(data));
	}

	private logData(data: any) {

		if (typeof data === 'string')
			console.log(data);
		else
			console.log(util.inspect(data, false, null));
	}
}