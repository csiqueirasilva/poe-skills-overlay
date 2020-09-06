const Logger = require('./Logger');
const os = require('os');
const { exec } = require("child_process");

class Files {

	static erase (filename) {
		
		if(os.platform() === "win32") {
				
			const eraseProc = exec("del -f \"" + filename + "\"", (error, stdout, stderr) => {
				if(error) {
					Logger.error('error on erasing temp file: ' + error);
				} else {
					Logger.log('erased temp file ' + filename);
				}
			});
			
		} else {
			let err = fs.unlinkSync(filename);
			if(err) {
				Logger.error('error on erasing temp file: ' + err);
			} else {
				Logger.log('erased temp file ' + filename);
			}
		}
	}

}

module.exports = Files;