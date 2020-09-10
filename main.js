const electron = require('electron');
const app = electron.app;
const screen = electron.screen;
const { stream } = require('./src/ScreenCapture');
const Config = require('./src/Config');

let config = Config.readConfig();

function createWindow () {

	const height = config.screen.height;
	const width = config.screen.width;

	const win = new electron.BrowserWindow({
		width: width,
		height: height,
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
	
	win.setIgnoreMouseEvents(true, { forward: true });
	
	win.setAlwaysOnTop(true, 'pop-up-menu');
	
	config.groups.forEach((el) => stream(win, el));
	
	win.loadFile('./index.html');
	
	let webContents = win.webContents;
	
	if(config.debug) {
		webContents.openDevTools({ mode: 'detach' });
	}
}

app.whenReady().then(createWindow);