var Pucman = {};

Pucman.Boot = function(game) {};

Pucman.Boot.prototype = {

	init: function() {
	
		//Erstellt neue Karte. (HTML-Container, Map-API)
		map = new mxn.Mapstraction('map', 'openlayers');
		//Center-location
		var latlon = new mxn.LatLonPoint(51.50733, -0.12769);
		//set Center and zoomlevel
		map.setCenterAndZoom(latlon, 10);
		map.setOption('enableDragging', true);
		//disable zoom panel
		map.addControls('pan', true);
		//Pointer ist eine Art Mausobjekt. maximale anzahl an Pointern
		this.input.maxPointers = 1;
		//stage ist "Bühne" auf der alles angezeigt wird
		//game wird bei fokusverlust nicht pausiert
		this.stage.disableVisibilityChange = true;
		//wenn wir auf dem DesktopPC spielen
		if (this.game.device.desktop) {
			//horizontal anpassen
			this.scale.pageAlignHorizontally = true;
		} else {
			//anpassen, das alles sichtbar ist
			this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			//minimale und maximale Größe (minWidth, minHeight, maxWidth, maxHeight)
			this.scale.setMinMax(480, 260, 1024, 768);
			//erzwinge horizontale ausrichtung
			this.scale.forceLandscape = true;
			//horizontal anpassen
			this.scale.pageAlignHorizontally = true;
	}
},

	preload: function() {},

	create: function() {
		//gehe in state Preloader
		this.state.start('Preloader', true, false, map);
	}
};
