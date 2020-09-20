const electron = require('electron');
const app = electron.app;
const screen = electron.screen;
const { stream } = require('./src/ScreenCapture');
const Config = require('./src/Config');
const Logger = require('./src/Logger');
const WatchClientTxt = require('./src/WatchClientTxt');

let config = Config.readConfig();

Logger.shouldLog(config.log);

function createWindow () {

	const win = new electron.BrowserWindow({
		fullscreen: true,
		transparent: true, 
		frame: false,
		alwaysOnTop: true,
		focusable: true,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});
	
	const display = electron.screen.getPrimaryDisplay();
	
	const height = parseInt(display.bounds.height * display.scaleFactor);
	const width = parseInt(display.bounds.width * display.scaleFactor);

	if(config.debug) {
		console.log('starting app with following parameters: width, height, scaleFactor');
		console.log(width, height, display.scaleFactor);
	}

	win.setIgnoreMouseEvents(true, { forward: true });
	
	win.setAlwaysOnTop(true, 'pop-up-menu');
	
	config.groups.forEach((el) => stream(win, el, width, height));

	let webContents = win.webContents;
	
	if(config.debug) {
		webContents.openDevTools({ mode: 'detach' });
	}
	
	webContents.on('did-finish-load', () => {
		WatchClientTxt.init(win);
		WatchClientTxt.start();
	});
	
	win.loadFile('./index.html');
}

app.whenReady().then(createWindow);