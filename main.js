const electron = require('electron');
const app = electron.app;
const screen = electron.screen;
const { stream } = require('./src/ScreenCapture');
const Config = require('./src/Config');

let config = Config.readConfig();

function createWindow () {

	const win = new electron.BrowserWindow({
		fullscreen: true,
		transparent: true, 
		frame: false,
		alwaysOnTop: true,
		focusable: false,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});
	
	const display = electron.screen.getPrimaryDisplay();
	
	const height = display.bounds.height * display.scaleFactor;
	const width = display.bounds.width * display.scaleFactor;

	win.setIgnoreMouseEvents(true, { forward: true });
	
	win.setAlwaysOnTop(true, 'pop-up-menu');
	
	config.groups.forEach((el) => stream(win, el, width, height));

	win.loadFile('./index.html');
	
	let webContents = win.webContents;
	
	if(config.debug) {
		webContents.openDevTools({ mode: 'detach' });
	}
}

app.whenReady().then(createWindow);