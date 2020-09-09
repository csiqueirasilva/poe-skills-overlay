const { spawn, execFile } = require("child_process");
const fs = require('fs');
const Files = require('./Files');
const Logger = require('./Logger');
const Config = require('./Config');

// Start of Image
const soi = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
// End of Image
const eoi = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

async function captureWindow (win, group) {
	
	const elementId = group.name;
	
	const config = Config.get();

	const offsetX = parseInt(config.screen.width * group.screen.offsetX);
	const offsetY = parseInt(config.screen.height * group.screen.offsetY);
	const sizeX = parseInt(config.screen.width * group.screen.sourceWidth);
	const sizeY = parseInt(config.screen.height * group.screen.sourceHeight);
	
	let args = [offsetX, offsetY, offsetX + sizeX, offsetY + sizeY];
	
	if(config.debug) {
		console.log(args);
	}
	
	const proc = spawn('bin/capture.exe', args);
	const stream = proc.stdout;
	
	let data = [];
	
	stream.on("data", chunk => {
		
		//var start = chunk.indexOf(soi);
		var end = chunk.indexOf(eoi, chunk.length - eoi.length);

		data.push(chunk);
		
		if(end !== -1) {
			let image = Buffer.concat(data);
			if(!win.isDestroyed()) {
				win.webContents.send('capture-' + elementId, Buffer.from(image).toString('base64'));
			}
			data = [];
		}
		
	});
	
}

module.exports.stream = captureWindow;