const electron = require('electron');
let app = electron.app;

if(app === undefined) {
	app = electron.remote.app;
}

const fs = require('fs');
const Logger = require('./Logger');

const CONFIG_FILE = app.getPath('documents') + '/poeskillsoverlay-config.json';
const CONFIG_REF_FILE = './config_ref.json';

let currentConfig = null;

class Config {
	
	static get () {
		return currentConfig;
	}

	static shouldLog() {
		return currentConfig ?? currentConfig.log;
	}
	
	static isDebugMode() {
		return currentConfig ?? currentConfig.debug;
	}
	
	static createIfNotExists() {
		let exists = fs.existsSync(CONFIG_FILE);
		if(!exists) {
			if(!Config.resetConfig()) {
				Logger.error('Couldnt create user config file. Exiting.');
				process.exit(-1);
			}
		}
	}
	
	static readConfig () {
		Config.createIfNotExists();
		let jsonRefConfig = fs.readFileSync(CONFIG_REF_FILE);
		let jsonUserConfig = fs.readFileSync(CONFIG_FILE);
		if(jsonRefConfig && jsonUserConfig) {
			try {
				currentConfig = JSON.parse(jsonRefConfig);
				let userConfig = JSON.parse(jsonUserConfig);
				currentConfig.dx = userConfig.dx;
				currentConfig.debug = userConfig.debug;
				currentConfig.log = userConfig.log;
				userConfig.groups.forEach((userGroup) => {
					let found = false;
					let foundGroup = null;
					
					for(let i = 0; i < currentConfig.groups.length && !found; i++) {
						found = currentConfig.groups[i].name === userGroup.name;
						if(found) {
							foundGroup = currentConfig.groups[i];
						}
					}
					
					if(!found) {
						currentConfig.groups.push(userGroup);
					} else {
						foundGroup.tooltips.forEach((tooltip) => {
							let updated = false;
							for(let i = 0; i < userGroup.tooltips.length && !updated; i++) {
								let ugTooltip = userGroup.tooltips[i];
								updated = ugTooltip.name === tooltip.name;
								if(updated) {
									tooltip.zoom = ugTooltip.zoom;
									tooltip.opacity = ugTooltip.opacity;
									tooltip.left = ugTooltip.left;
									tooltip.top = ugTooltip.top;
									tooltip.visible = ugTooltip.visible;
								}
							}
						});
					}
				});
				
			} catch (e) {
				Logger.error('Couldnt open config file. Cant proceed. Error: ' + e.message);
				process.exit(-1);
			}
		}
		return currentConfig;
	}
	
	static resetConfig() {
		let ret = true;
		let read = fs.readFileSync(CONFIG_REF_FILE);
		if(read) {
			let write = fs.writeFileSync(CONFIG_FILE, read);
			let exists = fs.existsSync(CONFIG_FILE);
			if(!exists) {
				Logger.error('Couldnt write config ref to config file. Cant proceed.');
				ret = false;
			}
		} else {
			Logger.error('Couldnt read config ref file. Cant proceed.');
			ret = false;
		}
		return ret;
	}
	
	static saveConfig(config) {
		currentConfig = config;
		let ret = true;
		let write = fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
		if(!write) {
			ret = false;
			Logger.error('Couldnt write config file. Error: ' + e.getMessage());
		}
		return ret;
	}
}

module.exports = Config;