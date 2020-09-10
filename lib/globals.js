const Config = require('./src/Config');
const webFrame = require('electron').webFrame;
const ipcRenderer = require('electron').ipcRenderer;
let config = Config.readConfig();

let app = require('electron').remote.app;
let win = require('electron').remote.getCurrentWindow();