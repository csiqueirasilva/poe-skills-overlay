$('#options-menu').bind('mouseenter', () => win.setIgnoreMouseEvents(false));
$('#options-menu').bind('mouseleave', () => win.setIgnoreMouseEvents(true, { forward: true }));

$('[data-toggle="tooltip"]').tooltip();

let interactingObject = null;
let isConfigMode = false;

function configMode () {
	$('.btn-overlay-mode').hide();
	$('.btn-config-mode').show();
	$('.group-wrapper').show();
	isConfigMode = true;
}

function overlayMode() {
	$('.btn-config-mode').hide();
	$('.btn-overlay-mode').show();
}

function createEditConfig(o) {
	// deep copy
	o.editConfigEl = JSON.parse(JSON.stringify(o.sourceConfigElement));
}

function createElementWithConfig(el, configEl, resetOriginalConfig) {
	let originalConfig = el.sourceConfigElement;
	let width = el.sourceWidth;
	let height = el.sourceHeight;
	let groupName = el.sourceGroupName;
	let ratio = el.sourceRatio;
	
	$(el).remove();
	
	let ret = createTooltipElement(configEl, width, height, ratio, groupName);
	
	if(resetOriginalConfig) {
		ret.sourceConfigElement = originalConfig;
	}
	
	return ret;
}

function cleanupConfigMode() {
	if(interactingObject !== null) {
		$('.config-edit-group').remove();
		interactingObject = null;
	}
	isConfigMode = false;
}

function resetAllConfigs() {
	let els = $('.group-wrapper');
	for(let i = 0; i < els.length; i++) {
		let el = els[i];
		let configEl = el.sourceConfigElement;
		createElementWithConfig(el, configEl);
	}
}

function applyAllEditConfigs() {
	let els = $('.group-wrapper');
	for(let i = 0; i < els.length; i++) {
		let el = els[i];
		let configEl = el.editConfigEl;
		createElementWithConfig(el, configEl);
	}
}

function saveNewConfigFile() {
	let config = Config.get();
	config.groups.forEach((group) => {
		let els = $('.group-wrapper-' + group.name);
		group.tooltips = [];
		for(let i = 0; i < els.length; i++) {
			let el = els[i];
			let configEl = el.sourceConfigElement;
			group.tooltips.push(configEl);
		}

	});
	Config.saveConfig(config);
}

var overlayOn = true;

function showOverlay() {
	resetAllConfigs();
	overlayOn = true;
}

function hideOverlay() {
	$('.group-wrapper').hide();
	overlayOn = false;
}

$('#toggle-overlay-button').bind('click', () => {
	if(!overlayOn) {
		showOverlay();
	} else {
		hideOverlay();
	}
});

ipcRenderer.on('hide-overlay', () => {
	hideOverlay();
});

ipcRenderer.on('show-overlay', () => {
	if(!overlayOn) {
		showOverlay();
	}
});

$('#quit-button').bind('click', () => app.quit());

$('#config-button').bind('click', () => {
	configMode();
});

$('#save-button').bind('click', () => {
	cleanupConfigMode();
	applyAllEditConfigs();
	hideGridAid();
	overlayMode();
	saveNewConfigFile();
});

$('#back-button').bind('click', () => {
	cleanupConfigMode();
	resetAllConfigs();
	hideGridAid();
	overlayMode();
});

function hideGridAid() {
	let el = $('#grid-visual-aid');
	el.hide();
	gridOn = false;
}

$('#grid-button').bind('click', () => {
	let el = $('#grid-visual-aid');
	if(el.is(':visible')) {
		el.hide();
		gridOn = false;
	} else {
		el.show();
		gridOn = true;
	}
	
	if(objectOptions) {
		objectOptions.focus();
	}
});

let gridOn = false;

function drawGrid() {
	let canvas = document.getElementById('grid-visual-aid');
	let ctx = canvas.getContext('2d');

	let w = window.innerWidth;
	let h = window.innerHeight;

	canvas.width = w;
	canvas.height = h;

	var added = (window.devicePixelRatio / 2);

	ctx.lineWidth = 1;

	for(let i = 0; i < w; i = i + config.gridsize) {
		ctx.beginPath();
		ctx.moveTo(i + added, 0 + added);
		ctx.lineTo(i + added, h + added);
		ctx.stroke();
	}
	
	for(let i = 0; i < h; i = i + config.gridsize) {
		ctx.beginPath();
		ctx.moveTo(0 + added, i + added);
		ctx.lineTo(w + added, i + added);
		ctx.stroke();
	}
}

drawGrid();

function setValuesForm(objectOptions) {
	if(interactingObject !== null) {
		$(objectOptions).find('.visibility-btn').hide();

		if(interactingObject.editConfigEl.visible) {
			$(objectOptions).find('.visible-btn').show();
		} else {
			$(objectOptions).find('.not-visible-btn').show();
		}

		$(objectOptions).find('.opacity-range').val(parseInt(interactingObject.editConfigEl.opacity * 100));

		$(objectOptions).find('.size-range').val(parseInt(interactingObject.editConfigEl.zoom * 100));
	}
}

function moveWithKeyboard(ev) {
	let key = ev.which;
	if(dElem !== null && anchorEl !== null && objectOptions !== null) {
		if(key >= 37 && key <= 40) {
			
			if(key === 40 /* arrow down */) {
				anchorEl.style.top = (parseInt(anchorEl.style.top.replace('px', '')) + 1) + 'px';
				dElem.style.top = (dElem.offsetTop + 1) + 'px';
			} else if(key === 37 /* arrow left */) {
				anchorEl.style.left = (parseInt(anchorEl.style.left.replace('px', '')) - 1) + 'px';
				dElem.style.left = (dElem.offsetLeft - 1) + 'px';
			} else if(key === 39 /* arrow right */) {
				anchorEl.style.left = (parseInt(anchorEl.style.left.replace('px', '')) + 1) + 'px';
				dElem.style.left = (dElem.offsetLeft + 1) + 'px';
			} else if(key === 38 /* arrow up */) {
				anchorEl.style.top = (parseInt(anchorEl.style.top.replace('px', '')) - 1) + 'px';
				dElem.style.top = (dElem.offsetTop - 1) + 
				'px';
			}
			
			dElem.editConfigEl.left = dElem.offsetLeft + 'px';
			dElem.editConfigEl.top = dElem.offsetTop + 'px';
			
		} else if(key === 13 /* confirm */) {
			document.onkeydown = null;
			$(objectOptions).find('.confirm-btn').trigger('click');
		} else if(key === 27 /* reset & confirm */) {
			document.onkeydown = null;
			$(objectOptions).find('.reset-btn').trigger('click');
			$(objectOptions).find('.confirm-btn').trigger('click');
		}
	}
}

let dElem = null;
let anchorEl = null;
let objectOptions = null;

function setInteractingObjectGlobals () {
	if(objectOptions !== null && interactingObject !== null) {
		objectOptions.targetElement = interactingObject;
		dElem = interactingObject;
		anchorEl = $(objectOptions)[0];
	}
}

var calcWidthElement = document.createElement('div');
document.body.appendChild(calcWidthElement);

function createTooltipElement(el, width, height, ratio, groupName) {

	let div = document.createElement('div');
	let img = document.createElement('img');

	img.draggable = false;

	div.appendChild(img);
	document.body.appendChild(div);
	
	div.sourceConfigElement = el;
	div.sourceWidth = width;
	div.sourceHeight = height;
	div.sourceRatio = ratio;
	div.sourceGroupName = groupName;
	
	if(!el.visible) {
		div.style.display = 'none';
	}
	
	let zoom = el.zoom;
	
	div.id = el.name;
	div.classList.add('group-wrapper');
	div.classList.add('group-wrapper-' + groupName);
	div.style.width = el.width.replace(/zoom/gi, el.zoom);
	div.style.height = el.height.replace(/zoom/gi, zoom);
	div.style.left = el.left.replace(/zoom/gi, 0.5);
	div.style.top = el.top.replace(/zoom/gi, 0.5);
	
	img.classList.add('group-' + groupName);
	img.name = groupName;
	img.style.width = 'calc(' + width + 'px * ' + el.zoom + ')';
	img.style.height = 'calc(' + height + 'px * ' + el.zoom + ')';
	img.style.opacity = el.opacity;
	img.style['margin-left'] = el.img['margin-left'].replace(/zoom/gi, el.zoom);
	img.style['margin-top'] = el.img['margin-top'].replace(/zoom/gi, zoom);
	
	createEditConfig(div);
	
	$(div).bind('mouseenter', () => {
		if(isConfigMode && interactingObject === null) {
			win.setIgnoreMouseEvents(false);
		}
	});

	$(div).bind('mouseleave', () => {
		if(interactingObject === null) {
			win.setIgnoreMouseEvents(true, { forward: true });
		}
	});

	$(div).bind('click', (ev) => {
		if(interactingObject === null) {
			interactingObject = $(ev.target).parents('.group-wrapper')[0];
			
			objectOptions = document.createElement('div');
			objectOptions.targetElement = interactingObject;
			objectOptions.classList.add('config-edit-group');
			objectOptions.style.border = '1px solid black';
			
			let refMenuObject = document.getElementById('ref-interacting-object');
			objectOptions.innerHTML = refMenuObject.innerHTML;
			objectOptions.style.position = 'absolute';
			
			objectOptions.style.left = '-10000px';
			objectOptions.style.top = '-10000px';
			
			$(objectOptions).find('.label-edit-el').html('#' + interactingObject.id);
			
			// set values to form

			setValuesForm(objectOptions);

			// end of set values to form
			
			// set form inputs
			
			$(objectOptions).find('.opacity-range').bind('input', (ev) => {
				var val = parseInt($(ev.target).val()) / 100;
				interactingObject.editConfigEl.opacity = val;
				$(interactingObject).find('img')[0].style.opacity = val;
				setInteractingObjectGlobals();
				$(interactingObject).show();
			});
			
			$(objectOptions).find('.size-range').bind('input', (ev) => {
				var val = parseInt($(ev.target).val()) / 100;
				
				var img = $(interactingObject).find('img')[0];
				
				var calcZoom = val;

				if(gridOn) {
					var refWidth = 5.75539568345324 / 0.5;

					calcWidthElement.style.position = 'absolute';
					calcWidthElement.style.width = refWidth + 'vh';
					
					var width = config.gridsize * 2;
					
					calcZoom = (width / calcWidthElement.offsetWidth) * Math.max(1, parseInt((val * 2)));
					
					console.log(calcZoom, width, calcWidthElement.offsetWidth, interactingObject.offsetWidth);
				}

				img.style.width = 'calc(' + interactingObject.sourceWidth + 'px * ' + calcZoom + ')';
				img.style.height = 'calc(' + interactingObject.sourceHeight + 'px * ' + calcZoom + ')';
				img.style['margin-left'] = el.img['margin-left'].replace(/zoom/gi, calcZoom);
				img.style['margin-top'] = el.img['margin-top'].replace(/zoom/gi, calcZoom);
				interactingObject.style.height = el.height.replace(/zoom/gi, calcZoom);
				interactingObject.style.width = el.width.replace(/zoom/gi, calcZoom);
				
				interactingObject.editConfigEl.zoom = calcZoom;
				
				setInteractingObjectGlobals();
				$(interactingObject).show();
			});
			
			$(objectOptions).find('.visibility-btn').bind('click', (ev) => {
				var visibleBtn = $(ev.currentTarget).parents('.config-edit-group').find('.visible-btn');
				var notVisibleBtn = $(ev.currentTarget).parents('.config-edit-group').find('.not-visible-btn');
				var visible = visibleBtn.is(':visible');
				if(visible) {
					visibleBtn.hide();
					notVisibleBtn.show();
					interactingObject.editConfigEl.visible = false;
				} else {
					visibleBtn.show();
					notVisibleBtn.hide();
					interactingObject.editConfigEl.visible = true;
				}
			});
			
			$(objectOptions).find('.confirm-btn').bind('click', (ev) => {
				$('.config-edit-group').remove();
				interactingObject = null;
				document.onkeydown = null;
				dElem = null;
				anchorEl = null;
				objectOptions = null;
				win.setIgnoreMouseEvents(true, { forward: true });
			});
			
			$(objectOptions).find('.reset-btn').bind('click', (ev) => {
				let el = interactingObject;
				let configEl = el.sourceConfigElement;
				interactingObject = createElementWithConfig(el, configEl);
				setInteractingObjectGlobals();
				setValuesForm(objectOptions);
				$(interactingObject).show();
			});
			
			setInteractingObjectGlobals();
			
			$(objectOptions).find('.move-btn').bind('mousedown', (ev) => {
				
				let dateRef = new Date().getTime();
				let dateDiff = 50; // ms
				
				var diffY = dElem.offsetTop - anchorEl.offsetTop;
				var diffX = dElem.offsetLeft - anchorEl.offsetLeft;

				document.onmouseup = () => {
					dElem.editConfigEl.left = dElem.offsetLeft + 'px';
					dElem.editConfigEl.top = dElem.offsetTop + 'px';
					document.onmouseup = null;
					document.onmousemove = null;
				};
				
				document.onmousemove = (ev) => {
					let stamp = new Date().getTime();
					let diff = (stamp - dateRef);
					if(diff > dateDiff) {
						var resX;
						var resY;
						
						if(gridOn) {
							resX = parseInt((ev.clientX + diffX) / config.gridsize) * config.gridsize;
							resY = parseInt((ev.clientY + diffY) / config.gridsize) * config.gridsize;
						} else {
							resX = (ev.clientX + diffX);
							resY = (ev.clientY + diffY);
						}
						
						anchorEl.style.left = ev.clientX + 'px';
						anchorEl.style.top = ev.clientY + 'px';
						dElem.style.left = resX + 'px';
						dElem.style.top = resY + 'px';
						dateRef = stamp;
					}
				};
			});
			
			$(objectOptions).bind('mouseenter', () => win.setIgnoreMouseEvents(false));
			
			window.focus();
			document.onkeydown = moveWithKeyboard;
			
			// end of set form inputs
			
			// adding to viewport and setting display coordinates
			
			document.body.appendChild(objectOptions);

			if(config.debug) {
				console.log('menu width, menu height');
				console.log(objectOptions.offsetWidth, objectOptions.offsetHeight);
			}
			
			if(ev.clientX < parseInt(window.innerWidth / 2)) { // open on right side
				objectOptions.style.left = (ev.clientX + (objectOptions.offsetWidth * 0.05)) + 'px' ;
			} else {
				objectOptions.style.left = (ev.clientX - (objectOptions.offsetWidth * 1.05)) + 'px' ;
			}

			if(ev.clientY < parseInt(window.innerHeight / 2)) { // open on bottom side
				objectOptions.style.top = (interactingObject.offsetTop + interactingObject.offsetHeight + 2) + 'px' ;
			} else {
				objectOptions.style.top = (interactingObject.offsetTop - objectOptions.offsetHeight - 2) + 'px' ;
			}
			
		}
	});
	
	return div;
}