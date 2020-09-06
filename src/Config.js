const fs = require('fs');
const Logger = require('./Logger');

const CONFIG_FILE = './config.json';
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
	
	static readConfig () {
		let json = fs.readFileSync(CONFIG_FILE);
		if(json) {
			try {
				currentConfig = JSON.parse(json);
			} catch (e) {
				Logger.error('Couldnt open config file. Cant proceed. Error: ' + e.getMessage());
				process.exit(-1);
			}
		}
		return currentConfig;
	}
	
	static resetConfig() {
		let ret = true;
		let read = fs.readFileSync(CONFIG_REF_FILE);
		if(read) {
			let write = fs.writeFileSync(CONFIG_FILE);
			if(!write) {
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