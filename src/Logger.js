const fs = require('fs');
const Config = require('./Config');

const ERROR_FILE = './error.log';
const LOG_FILE = './output.log';
const LOG_ENCODING = 'utf8';

class Logger {
	
	static getDate() {
		let m = new Date();
		let dateString =
			m.getFullYear() + "/" +
			("0" + (m.getMonth()+1)).slice(-2) + "/" +
			("0" + m.getDate()).slice(-2) + " " +
			("0" + m.getHours()).slice(-2) + ":" +
			("0" + m.getMinutes()).slice(-2) + ":" +
			("0" + m.getSeconds()).slice(-2);
		return dateString;
	}
	
	static addLogEntry(msg, file) {
		fs.appendFileSync(file, '[' + Logger.getDate() + ']\n' + msg);
	}
	
	static error (msg) {
		Logger.addLogEntry(msg, ERROR_FILE);
	}
	
	static log (msg) {
		if(Config.shouldLog()) {
			Logger.addLogEntry(msg, LOG_FILE);
		}
	}
	
}

module.exports = Logger;

