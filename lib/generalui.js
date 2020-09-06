let app = require('electron').remote.app;

let win = require('electron').remote.getCurrentWindow();

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

	$(el).remove();
	
	let ret = createTooltipElement(configEl, width, height, groupName);
	
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

$('#quit-button').bind('click', () => app.quit());

$('#config-button').bind('click', () => {
	configMode();
});

$('#save-button').bind('click', () => {
	cleanupConfigMode();
	applyAllEditConfigs();
	overlayMode();
	saveNewConfigFile();
});

$('#back-button').bind('click', () => {
	cleanupConfigMode();
	resetAllConfigs();
	overlayMode();
});

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

function createTooltipElement(el, width, height, groupName) {

	let div = document.createElement('div');
	let img = document.createElement('img');

	img.draggable = false;

	div.appendChild(img);
	document.body.appendChild(div);
	
	div.sourceConfigElement = el;
	div.sourceWidth = width;
	div.sourceHeight = height;
	div.sourceGroupName = groupName;
	
	if(!el.visible) {
		div.style.display = 'none';
	}
	
	div.id = el.name;
	div.classList.add('group-wrapper');
	div.classList.add('group-wrapper-' + groupName);
	div.style.width = el.width.replace(/zoom/gi, el.zoom);
	div.style.height = el.height.replace(/zoom/gi, el.zoom);
	div.style.left = el.left.replace(/zoom/gi, 0.5);
	div.style.top = el.top.replace(/zoom/gi, 0.5);
	
	img.classList.add('group-' + groupName);
	img.style.width = 'calc(' + width + 'px * ' + el.zoom + ')';
	img.style.height = 'calc(' + height + 'px * ' + el.zoom + ')';
	img.style.opacity = el.opacity;
	img.style['margin-left'] = el.img['margin-left'].replace(/zoom/gi, el.zoom);
	img.style['margin-top'] = el.img['margin-top'].replace(/zoom/gi, el.zoom);
	
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
			let objectOptions = document.createElement('div');
			objectOptions.targetElement = interactingObject;
			objectOptions.classList.add('config-edit-group');
			objectOptions.style.border = '1px solid black';
			objectOptions.innerHTML = document.getElementById('ref-interacting-object').innerHTML;
			objectOptions.style.position = 'absolute';
			objectOptions.style.left = (ev.clientX - (interactingObject.offsetWidth / 2)) + 'px' ;
			objectOptions.style.top = (ev.clientY + interactingObject.offsetHeight + 5)  + 'px';
			
			$(objectOptions).find('.label-edit-el').html('#' + interactingObject.id);
			
			document.body.appendChild(objectOptions);
			
			// set values to form

			setValuesForm(objectOptions);

			// end of set values to form
			
			// set form inputs
			
			$(objectOptions).find('.opacity-range').bind('change', (ev) => {
				var val = parseInt($(ev.target).val()) / 100;
				interactingObject.editConfigEl.opacity = val;
				interactingObject = createElementWithConfig(interactingObject, interactingObject.editConfigEl, true);
				$(interactingObject).show();
			});
			
			$(objectOptions).find('.size-range').bind('change', (ev) => {
				var val = parseInt($(ev.target).val()) / 100;
				interactingObject.editConfigEl.zoom = val;
				interactingObject = createElementWithConfig(interactingObject, interactingObject.editConfigEl, true);
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
				win.setIgnoreMouseEvents(true, { forward: true });
			});
			
			$(objectOptions).find('.reset-btn').bind('click', (ev) => {
				let el = interactingObject;
				let configEl = el.sourceConfigElement;
				interactingObject = createElementWithConfig(el, configEl);
				setValuesForm(objectOptions);
				$(interactingObject).show();
			});
			
			$(objectOptions).find('.move-btn').bind('mousedown', (ev) => {
				let anchorEl = $(objectOptions)[0];
				
				let dateRef = new Date().getTime();
				let dateDiff = 50; // ms
				
				var dElem = $('#' + div.id)[0];
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
						anchorEl.style.left = ev.clientX + 'px';
						anchorEl.style.top = ev.clientY + 'px';
						dElem.style.left = (ev.clientX + diffX) + 'px';
						dElem.style.top = (ev.clientY + diffY) + 'px';
						dateRef = stamp;
					}
				};
			});
			
			// end of set form inputs
		}
	});
	
	return div;
}

win.setIgnoreMouseEvents(true, { forward: true });