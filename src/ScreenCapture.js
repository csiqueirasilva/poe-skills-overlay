const { spawn, execFile } = require("child_process");
const fs = require('fs');
const Files = require('./Files');
const Logger = require('./Logger');
const Config = require('./Config');

// Start of Image
const soi = Buffer.from([0xff, 0xd8]);

// End of Image
const eoi = Buffer.from([0xff, 0xd9]);

async function captureWindow (win, group, width, height) {
	
	const elementId = group.name;
	
	const config = Config.get();

	const refAspect = 16/9;
	const aspect = width/height;
	const rateAspect = refAspect / aspect;
	let offsetX;

	if(group.screen.offsetX < 0) {
		offsetX = parseInt(width + width * group.screen.offsetX * rateAspect);
	} else {
		offsetX = parseInt(width * group.screen.offsetX * rateAspect);
	}
	
	const offsetY = parseInt(height * group.screen.offsetY);
	const sizeX = parseInt(width * group.screen.sourceWidth * rateAspect);
	const sizeY = parseInt(height * group.screen.sourceHeight);
	
	let args = [offsetX, offsetY, offsetX + sizeX, offsetY + sizeY];
	
	if(config.debug) {
		console.log('left, top, right, bottom');
		console.log(args);
	}
	
	let execPath = 'bin/capture.exe';
	
	if(config.dx === 9) {
		execPath = 'bin/capture9.exe';
	}
	
	if(config.debug) {
		console.log('starting group ' + group.name + ' with binary ' + execPath);
	}

	const proc = spawn(execPath, args);
	const stream = proc.stdout;
	
	let data = [];
	let image;
	let end;
	let remaining;
	
	stream.on("data", chunk => {
		
		//var start = chunk.indexOf(soi);
		end = chunk.indexOf(eoi, chunk.length - eoi.length);

		data.push(chunk);
		
		if(end !== -1) {
			image = Buffer.concat(data);
			if(!win.isDestroyed()) {
				win.webContents.send('capture-' + elementId, Buffer.from(image).toString('base64'));
			}
			data = [];
			// if remaining data
			remaining = chunk.slice(end + eoi.length);
			if(remaining.length > 0) {
				data.push(remaining);
			}
		}
		
	});
	
}

module.exports.stream = captureWindow;