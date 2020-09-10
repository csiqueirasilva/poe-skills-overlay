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
	const width = parseInt(group.screen.sourceWidth * config.screen.width);
	const height = parseInt(group.screen.sourceHeight * config.screen.height);
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
	
	group.tooltips.forEach((tooltip) => createTooltipElement(tooltip, width, height, group.name));
	
	const base64ident = 'data:image/png;base64,';

	ipcRenderer.on('capture-' + elementId, (event, store) => {
		if(config !== null) {
			img.src = base64ident + store;
			propagateImg(img, elementId);
		}
	});
}

config.groups.forEach((group) => createSourceImg(group));