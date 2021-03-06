const fs = require('fs');
const ERROR_FILE = './error.log';
const LOG_FILE = './output.log';
const LOG_ENCODING = 'utf8';

const consoleLog = console.log;

console.log = (...args) => {
	consoleLog(...args);
	Logger.log(args.toString());
};

let enableLog = false;

class Logger {
	
	static shouldLog (op) {
		enableLog = op;
	}
	
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
		fs.appendFileSync(file, '[' + Logger.getDate() + '] ' + msg + '\n');
	}
	
	static error (msg) {
		consoleLog(msg);
		Logger.addLogEntry(msg, ERROR_FILE);
	}
	
	static log (msg) {
		Logger.addLogEntry(msg, LOG_FILE);
	}
	
}

module.exports = Logger;

