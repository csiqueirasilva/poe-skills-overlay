function propagateImg(img, name) {
	document.querySelectorAll('img.group-' + name)
		.forEach(el => {
			if($(el).is(':visible')) {
				el.src = img.src;
			}
		});
}

function createSourceImg(group) {
	const elementId = group.name;
	const refAspectRatio = 16 / 9; // sizes were created in this aspect, so it is used in calculations for other resolutions
	const aspectRatio = window.screen.width / window.screen.height;
	const rateRatio = refAspectRatio / aspectRatio;
	const pixelRatio = 1.25; // sizes were created in this pixelRatio, so it is used in calculations for other resolutions
	const width = parseInt(group.screen.sourceWidth * window.screen.width * pixelRatio * rateRatio);
	const height = parseInt(group.screen.sourceHeight * window.screen.height * pixelRatio);
	const div = document.createElement('div');
	const img = document.createElement('img');
	
	div.appendChild(img);
	document.body.appendChild(div);
	
	if(config.debug) {
		div.style.display = 'block';
		div.style['margin-top'] = '10vh';
		console.log('initiating ' + elementId + ' group');
		console.log('rateRatio, width, height');
		console.log(rateRatio, width, height);
	} else {
		div.style.display = 'none';
	}
	
	img.width = width;
	img.height = height;
	img.id = elementId;
	
	group.tooltips.forEach((tooltip) => createTooltipElement(tooltip, width, height, rateRatio, group.name));
	
	const base64ident = 'data:image/jpeg;base64,';

	let frameTime = new Date().getTime();
	
	ipcRenderer.on('capture-' + elementId, (event, store) => {
		/*if(config.debug) {
			let thisTime = new Date().getTime();
			console.log(elementId + ' fps: ' + parseInt(1000/(thisTime - frameTime)));
			frameTime = thisTime;
		}*/
		
		if(config !== null) {
			img.src = base64ident + store;
			propagateImg(img, elementId);
		}
	});
}

config.groups.forEach((group) => createSourceImg(group));