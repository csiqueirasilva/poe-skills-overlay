# poe-skills-overlay
Stream the user interface into floating icons, similar to the popular world of warcraft addon "weak auras"

(Click the image for a video)
[![Screenshot of the icons floating](https://i.imgur.com/Su3Kfo1.png)](https://www.youtube.com/watch?v=PmDFohOiKc8)

# disclaimer

Currently don't know if using it would violate any terms in the game. Refrain from using it.

# environment

was tested on windows 10; there's a parameter to use the capture with dx9, so it in theory should be able to run on windows below 8 (with dx: 9 set on the configuration file)

# configuration file

**poeskillsoverlay-config.json**, stored inside your 'Documents' folder (or 'My Documents') is created when the application is first run. there resides all your customizations (icons zoom, position, opacity and visibility).

**config_ref.json** is the default configuration file

Configuration is read as follows: first the app checks if **poeskillsoverlay-config.json** exists, if not, it creates it by copying **config_ref.json**.

Some settings, like DirectX capture mode, must be made manually to **poeskillsoverlay-config.json**.

Below is some explanation for the configuration file.

```
{
	"debug": false, /* opens the browser inspector, allows some additional debugging information to be displayed; values are true or false */
	"log": false, /* logs some information to output.log; values are true or false */
	"dx": 11, /* sets directX capture mode; values are 9 or 11 */
	"groups": [ /* the app captures the screen based on elements in this array.   */
		{		/* only tooltips will be updated as the user makes any changes to */ the interface */
			"name": "skills",
			"screen": {
				"sourceWidth": 0.1432291666666667,  /* some settings were made  */
				"sourceHeight": 0.1111111111111111, /* using percentages        */
				"offsetX": -0.265625,				/* thoses will likely scale */
				"offsetY": 0.87962962962962965      /* to any aspect ratio      */
			},										/* as the app does the      */
			"tooltips": [							/* calculations             */
				{ 	
				/* inside tooltips, only visible, opacity, zoom, left and top will be updated by the user, when customizing the icons within the user interface */
					"visible": true,
					"opacity": 0.65,
					"zoom": 0.5,
					"name": "q-aura",
					"img": {
						"margin-left": "calc(-0.46296296296296vh * zoom)",
						"margin-top": "calc(-8.33333333333333vh * zoom)"
					},
					"width": "calc(5.75539568345324vh * zoom)",
					"height": "calc(5.75539568345324vh * zoom)",
					"left": "calc(50vw - (5.75539568345324vh * zoom))",
					"top": "calc(29.5vh - (5.75539568345324vh * zoom))"
				} 
	(...) 
```

# errors

some errors are reported on **error.log**, inside the installation directory.

# tested resolutions and environment

added some code to attempt to scale (up or down) everything, based on my display settings (1920x1080).

game has to be on fullscreen windowed for overlay to work.

tested resolutions (icons should work, but UI is not properly tested)
- 1152x864
- 1280x768
- 1280x800
- 1280x900
- 1280x960
- 1280x1024
- 1360x768
- 1366x768
- 1400x1050
- 1440x900
- 1600x900
- 1600x1024
- 1680x1050
- 1920x1080
