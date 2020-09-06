const ffmpeg = require("ffmpeg-static");
const { spawn } = require("child_process");
const tempFile = require('./TempFile');
const fs = require('fs');
const Files = require('./Files');
const Logger = require('./Logger');
const Config = require('./Config');

const SEC_RENEW = 240 * 1000;
const DELAY_ERASE_OLD = 10 * 1000;

const streamTable = {};
let streamId = 0;

function createStream(filename, win, group) {

	const elementId = group.name;

	const config = Config.get();

	const offsetX = parseInt(config.screen.width * group.screen.offsetX);
	const offsetY = parseInt(config.screen.height * group.screen.offsetY);
	const sizeX = parseInt(config.screen.width * group.screen.sourceWidth);
	const sizeY = parseInt(config.screen.height * group.screen.sourceHeight);
	const quality = config.videoQuality;
	const fps = config.fps;
	
	const proc = spawn(
		ffmpeg,
	  ["-f", "gdigrab", "-framerate", fps, "-video_size", sizeX + "x" + sizeY, "-offset_x", offsetX, "-offset_y", offsetY, "-i", "title=Path of Exile", "-f", "mjpeg", "-huffman", "optimal", "-qscale", quality, "-"],
	  { stdio: "pipe" }
	);

	const stream = proc.stdout;
	
	stream.streamId = streamId++;
	
	const file = fs.createWriteStream(filename);
	stream.pipe(file);

	setTimeout(() => {

		Logger.log('restarting capture process');

		captureWindow(win, group);
		
		setTimeout(() => {

			proc.kill();

			Files.erase(filename);

		}, DELAY_ERASE_OLD);
		
	}, SEC_RENEW);

	return stream;
}

// Start of Image
const soi = Buffer.from([0xff, 0xd8]);

// End of Image
const eoi = Buffer.from([0xff, 0xd9]);

async function captureWindow (win, group) {
	
	const elementId = group.name;
	const file = await tempFile.load();
	let fpath = file.data.path;
	let previousStream = streamTable[elementId];
	let stream = createStream(fpath, win, group);
	let data = [];
	
	stream.on("data", chunk => {
		
		var start = chunk.indexOf(soi);
		var end = chunk.indexOf(eoi);

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