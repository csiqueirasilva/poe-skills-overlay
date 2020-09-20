const Tail = require('always-tail');
const Logger = require('./Logger');
const Config = require('./Config');

let config = Config.readConfig();

const enterAreaRegex = /^\d+\/\d+\/\d+ \d\d:\d\d:\d\d \d+ ba9 \[.*] : You have entered (.*)\.\r$/gm;
let tail = null;
let win = null;

class WatchClientTxt {
	static init(winArg) {
		win = winArg;
	}
	
	static start () {
		if(config.autohide && tail === null && win !== null) {
			
			if(config.debug) {
				console.log('starting to watch ' + config.clientLog);
			}
			
			tail = new Tail(config.clientLog, '\n', {
				interval: 100
			});
			
			tail.on("line", (data) => {
				var match = enterAreaRegex.exec(data);
				if(match instanceof Array && match[1] !== undefined) {
					let area = match[1];
					if(config.autohideAreas.indexOf(area) !== -1) {
						win.webContents.send('hide-overlay');
					} else {
						win.webContents.send('show-overlay');
					}
				}
			});

			tail.on("error", (error) => {
				console.log(error);
			});
			
			tail.watch();
		}
	}
	
	static stop () {
		if(tail !== null) {
			tail.unwatch();
			tail = null;
		}
	}
}

module.exports = WatchClientTxt;