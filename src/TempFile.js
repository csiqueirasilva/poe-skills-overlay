const tmp = require('tmp');
const sleep = require('./Sleep');

class TempFile {
	
	constructor() {
		this.error = false;
		this.data = {};
		this.cleanup = null;
		this.loaded = false;
		
		let outer = this;
		
		tmp.file((err, path, fd, cleanupCallback) => {
			if (err) {
				outer.error = err;
			} else {
				outer.data.path = path;
				outer.data.descriptor = fd;
				outer.cleanup = cleanupCallback;
			}
			outer.loaded = true;
		});
	}

	get hasError() {
		return this.error;
	}

	get isLoaded() {
		return this.loaded;
	}

	cleanUp() {
		if(cleanup instanceof Function) {
			cleanup();
		}
	}
	
}

async function _load() {
	const tempFile = new TempFile();
	const sleepMs = 10;
	
	do {
		await sleep(sleepMs);
	} while (!tempFile.isLoaded);
	
	if(tempFile.hasError) {
		console.log('Error while creating temp file: ' + tempFile.hasError());
		tempFile = null;
	}
	
	return tempFile;
};

module.exports.load = async function _extLoad () {
	let ret = false;
	let promise = await _load();
	ret = Promise.resolve(promise);
	return ret;
}