Pucman.Game = function(game) {

	this.map = null;
	this.layer = null;
	this.pacman = null;
	this.safetile = 14;
	this.gridsize = 16;
	this.speed = 150;
	this.threshold = 3;
	this.marker = new Phaser.Point();
	this.turnPoint = new Phaser.Point();
	this.directions = [null, null, null, null, null];
	this.opposites = [Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP];
	this.current = Phaser.NONE;
	this.turning = Phaser.NONE;
	this.mapController = null;

};

Pucman.Game.prototype = {

	init: function() {
		//so scalen, dass alles sichtbar ist
		this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		//horizontal und vertikal anpassen
		this.scale.pageAlignHorizontally = true;
		this.scale.pageAlignVertically = true;
		//set rendering property to crisp
		Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
		//startet Physiksimulation im Modus Arcade
		this.physics.startSystem(Phaser.Physics.ARCADE);
	},
	
	preload: function() {
		//Bilder, spritesheet und tilemap laden
		this.load.image('dot', 'resources/dot.png');
		this.load.image('tiles', 'resources/pacman-tiles.png');
		this.load.spritesheet('pacman', 'resources/pacman.png', 32, 32);
		this.load.tilemap('map', 'resources/pacman-map.json', null, Phaser.Tilemap.TILED_JSON);
	},
	
	create: function() {
		//tilemap hinzufügen
		this.map = this.add.tilemap('map');
		//tileset hinzufügen
		this.map.addTilesetImage('pacman-tiles', 'tiles');
		//layer für das spiel erzeugen
		this.layer = this.map.createLayer('Pacman');
		//erzeugt Gruppe von physischen Objekten, in dem Fall die Punkte
		this.dots = this.add.physicsGroup();
		//Map aus Tilemap erzeugen
		this.map.createFromTiles(7, this.safetile, 'dot', this.layer, this.dots);
		//Punkte in die Mitte des Weges setzen
		this.dots.setAll('x', 6, false, false, 1);
		this.dots.setAll('y', 6, false, false, 1);
		//Kollision mit allen Tiles außer safeTile
		this.map.setCollisionByExclusion([this.safetile], true, this.layer);
		//Position Pacman at grid location 14x17 (the +8 accounts for his anchor)
		//Startposition Pacman: 14,17. 16 ist die tilesize, +8 um ihn zu zentrieren
		this.pacman = this.add.sprite((14 * 16) + 8, (17 * 16) + 8, 'pacman', 0);
		//Ankerpunkt des Sprites in die Mitte setzen
		this.pacman.anchor.set(0.5);
		//Anomation hinzufügen, Array ist Reihenfolge der Sprites, frameRate, loop
		this.pacman.animations.add('munch', [0, 1, 2, 1], 20, true);
		//Erzeuge physisches Objekt für Pacman
		this.physics.arcade.enable(this.pacman);
		//größe des physischen Körpers
		this.pacman.body.setSize(16, 16, 0, 0);
		//keys für hoch, runter, links, rechts
		this.cursors = this.input.keyboard.createCursorKeys();
		//animation starten
		this.pacman.play('munch');
		//Bewegung nach links starten
		this.move(Phaser.LEFT);
		
		//funktion die aufgerufen wird, wenn mausrad bewegt
		//nicht benötigt
		//this.input.mouse.mouseWheelCallback = this.mouseWheel;
		
		//keine Ahnung?!
		this.mapController = this.add.sprite(0, 0);
		this.mapController.inputEnabled = true;
		this.mapController.input.enableDrag(true);
		this.mapController.scale = 1000;
		this.mapController.scale.y = 1000;
	},
	
	mouseWheel: function(event) {
		//Ausgabe des Wertes des Mausrads
		console.log(this.input.mouse.wheelDelta);
		console.log(map.getZoom());
		this.world.scale.x = map.getZoom() / 10.0; 
		this.world.scale.y = map.getZoom() / 10.0; 
		map.setZoom(map.getZoom() + this.input.mouse.wheelDelta);
	},
	
	//Eingabe auswerten
	checkKeys: function() {
		if (this.cursors.left.isDown && this.current !== Phaser.LEFT) {
			this.checkDirection(Phaser.LEFT);
		} else if (this.cursors.right.isDown && this.current !== Phaser.RIGHT) {
			this.checkDirection(Phaser.RIGHT);
		} else if (this.cursors.up.isDown && this.current !== Phaser.UP) {
			this.checkDirection(Phaser.UP);
		} else if (this.cursors.down.isDown && this.current !== Phaser.DOWN) {
			this.checkDirection(Phaser.DOWN);
		} else {
			//This forces them to hold the key down to turn the corner
			this.turning = Phaser.NONE;
		}
	},
	
	checkDirection: function(turnTo) {
		if (this.turning === turnTo || this.directions[turnTo] === null || this.directions[turnTo].index !== this.safetile) {
			//kein Abbiegen, wenn die Richtung gleich ist oder wenn das nächste Tile nicht existiert
			//oder wenn das nächste Tile nicht betretbar ist
			return;
		}
		//Check if they want to turn around and can
		if (this.current === this.opposites[turnTo]) {
			this.move(turnTo);
		} else {
			this.turning = turnTo;
			this.turnPoint.x = (this.marker.x * this.gridsize) + (this.gridsize / 2);
			this.turnPoint.y = (this.marker.y * this.gridsize) + (this.gridsize / 2);
		}
	},
	
	turn: function() {
		var cx = Math.floor(this.pacman.x);
		var cy = Math.floor(this.pacman.y);
		//This needs a threshold, because at high speeds you can't turn because the coordinates skip past
		if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold)) {
			return false;
		}
		//Grid align before turning
		//Position updaten
		this.pacman.x = this.turnPoint.x;
		this.pacman.y = this.turnPoint.y;
		this.pacman.body.reset(this.turnPoint.x, this.turnPoint.y);
		this.move(this.turning);
		this.turning = Phaser.NONE;
		return true;
	},
	
	move: function(direction) {
		var speed = this.speed;
		if (direction === Phaser.LEFT || direction === Phaser.UP) {
			speed = -speed;
		}
		if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
			this.pacman.body.velocity.x = speed;
		} else {
			this.pacman.body.velocity.y = speed;
		}
		//Sprite drehen bzw. spiegeln
		this.pacman.scale.x = 1;
		this.pacman.angle = 0;
		if (direction === Phaser.LEFT) {
			//Bild vertikal spiegeln
			this.pacman.scale.x = -1;
		} else if (direction === Phaser.UP) {
			//Drehen
			this.pacman.angle = 270;
		} else if (direction === Phaser.DOWN) {
			//Drehen
			this.pacman.angle = 90;
		}
		this.current = direction;
	},
	
	eatDot: function(pacman, dot) {
		//Punkt entfernen
		dot.kill();
		//Wenn Punkte alle weg, neue erzeugen
		if (this.dots.total === 0) {
			this.dots.callAll('revive');
		}
	},
	
	update: function() {
		//Kollision überprüfen
		this.physics.arcade.collide(this.pacman, this.layer);
		//Auf überschneidungen zwischen pacman und den punkten prüfen, bei treffer eatDot aufrufen
		this.physics.arcade.overlap(this.pacman, this.dots, this.eatDot, null, this);
		//Position auf ganzes Tile zurücksetzen
		this.marker.x = this.math.snapToFloor(Math.floor(this.pacman.x), this.gridsize) / this.gridsize;
		this.marker.y = this.math.snapToFloor(Math.floor(this.pacman.y), this.gridsize) / this.gridsize;
		//Anliegende Tiles bestimmen
		this.directions[1] = this.map.getTileLeft(this.layer.index, this.marker.x, this.marker.y);
		this.directions[2] = this.map.getTileRight(this.layer.index, this.marker.x, this.marker.y);
		this.directions[3] = this.map.getTileAbove(this.layer.index, this.marker.x, this.marker.y);
		this.directions[4] = this.map.getTileBelow(this.layer.index, this.marker.x, this.marker.y);
		//Tastatureingabe
		this.checkKeys();
		//Drehung
		if (this.turning !== Phaser.NONE) {
			this.turn();
		}
	}
};
