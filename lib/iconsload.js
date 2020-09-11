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
	const refAspectRatio = 16 / 9;
	const aspectRatio = window.screen.width / window.screen.height;
	const rateRatio = refAspectRatio / aspectRatio;
	const width = parseInt(group.screen.sourceWidth * window.screen.width * window.devicePixelRatio * rateRatio);
	const height = parseInt(group.screen.sourceHeight * window.screen.height * window.devicePixelRatio * rateRatio);
	const div = document.createElement('div');
	const img = document.createElement('img');
	
	div.appendChild(img);
	document.body.appendChild(div);
	
	if(config.debug) {
		div.style.display = 'block';
		div.style['margin-top'] = '10vh';
	} else {
		div.style.display = 'none';
	}
	
	img.width = width;
	img.height = height;
	img.id = elementId;
	
	group.tooltips.forEach((tooltip) => createTooltipElement(tooltip, width, height, rateRatio, group.name));
	
	const base64ident = 'data:image/png;base64,';

	ipcRenderer.on('capture-' + elementId, (event, store) => {
		if(config !== null) {
			img.src = base64ident + store;
			propagateImg(img, elementId);
		}
	});
}

config.groups.forEach((group) => createSourceImg(group));