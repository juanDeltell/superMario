window.addEventListener("load",function() {
	start();
});


function start() {
	
	//Iniciamos el Quintus en el canvas de id 'myGame'
	var Q = window.Q =  Quintus().include("Sprites,Scenes, Input, Touch, UI, TMX, Anim, 2D, Audio").setup("myGame").controls().touch().enableSound();
	
	Q.input.keyboardControls({
		13: "enter"
	});
	
	////////////////////////////////////////////////////////////////////////////////////
	// Component definition enemy
	////////////////////////////////////////////////////////////////////////////////////
	
	Q.component("defaultEnemy", {
		start : function(that) {
			that.isAlive = true;
			that.play("normal");
			that.on("bump.top",this,"aplastado");
			that.on("bump.left,bump.right,bump.bottom",this,"mata");
			that.on("muero",this,"muerte");
			
			this.that = that;
		},
		
		aplastado: function(collision) {
			if(this.that.isAlive) {
				if(collision.obj.isA("Mario")) {
					collision.obj.p.vy = -300;
					this.that.play("aplastao");
					this.that.p.vx = 0;
					this.that.isAlive = false;
					this.that.animate({ x: this.that.p.x, y: (this.that.p.y + 200)}, 1);
				}
			}
		},
		
		muerte: function() {
			this.that.destroy();
		},
		
		mata: function(collision) {
			if(collision.obj.isA("Mario") && collision.obj.isAlive) {
				collision.obj.muere();
			}
		}
	});
	
	
	////////////////////////////////////////////////////////////////////////////////////
	// Sprites definition
	////////////////////////////////////////////////////////////////////////////////////
	
	// Creamos el Sprite Mario
	Q.Sprite.extend("Mario", {
		init: function(p) {
			
			//Asignamos el sheet
			this._super({
				sprite:"marioR",
				sheet: "marioR",
				x: 50,
				y: 550,
				angle: 0,
				jumpSpeed: -500
			});
			
			this.isAlive = true;
			//Añadimos los modulos
			this.add("2d, platformerControls, animation, tween");
		
			
			//this.play("andando");

			
		},
		
		step: function(dt) {
			if(!this.isAlive) {
				this.p.vx = 0;
				this.p.vy = 0;
			}
			else {
				// Si se cae lo ponemos en la posicion inicial
				if(this.p.y > 600)  {
					this.muere();
					return;
				}
				
				if(this.p.landed < 0) {
					if(this.p.direction == "right")
						this.play("salto_derecha");
					else
						this.play("salto_izquierda");
				}
			
				else if(this.p.vx == 0) {
					if(this.p.direction == "right")
						this.play("quieto_derecha");
					else
						this.play("quieto_izquierda");
				}
				else if(this.p.vx > 0) {
					this.play("derecha");
				}
				else
					this.play("izquierda");
			}
		},
		
		muere : function() {
			this.play("muerto");
			Q.audio.stop();
			Q.audio.play("music_die.mp3");
			this.isAlive = false;
			this.animate({ x: this.p.x, y: (this.p.y + 220)}, 3,Q.Easing.Quadratic.Out, { callback : vidaFuera});
			
			if(Q.state.get("lifes") == 1) {
				console.log("entra en fin");
				this.fin();
			}
			
		},
		
		fin: function() {
				this.end = true;
				Q.stageScene("endGame",1, { label: "You loose!" }); 
			}
		
		

	});
	
	//Definicion de la moneda
	Q.Sprite.extend("Coin", {
		init: function(p) {
			this._super({
				sprite:"coin",
				sheet: "coin",
				x: 200,
				y: 400,
				vx: 0,
				vy: 0,
				gravity: 0,
				sensor: true
			});
			
			this.isTaken = false;
			this.add("2d,animation,tween");
			this.play('normal');
			this.on("bump.top,bump.left,bump.right,bump.bottom",this,"taken");
			
		},
		
		setPos : function(x,y) {
			this.p.x = x;
			this.p.y = y;
		},
		
		taken: function(collision) {
		if(!this.isTaken) {
				if(collision.obj.isA("Mario") && collision.obj.isAlive) {
					//this.animate({ x: this.p.x, y: (this.p.y - 200)}, 2, {callback: (function(a){a.destroy()})(this)}0);
					this.animate({ x: this.p.x, y: (this.p.y - 80)}, 1/3,{ callback: function() { this.destroy(); }});
					this.isTaken = true;
					Q.state.inc("coins",1);
					Q.audio.play("coin.mp3");
				}
			}
		},
		
		step: function(dt) {
			this.p.vy = 0;
		}
	});
	
	//Definicion de Goomba
	Q.Sprite.extend("Goomba", {
		init: function(p) {
		
			this._super({
				sprite:"goomba",
				sheet: "goomba",
				x: 1700,
				y: 350,
				vx: 100
			});
			this.add("2d, aiBounce, animation, tween, defaultEnemy");
			
			this.defaultEnemy.start(this);
		},
	
	});
	
	// Sprite Bloopa
	Q.Sprite.extend("Bloopa", {
		init: function(p) {
			this.acu = 2.5;
			this._super({
				sprite: "bloopa",
				sheet: "bloopa",
				x: 200,
				y: 550,
				vx: 20
			});
			this.isAlive = true;
			this.add("2d, animation, tween, defaultEnemy");
			
			this.defaultEnemy.start(this);
		},
		
		
		step: function(dt) {
			if(this.acu > 3) {
				this.acu = 0;
				this.jump();
			}
			this.acu += dt;
			
			if(this.p.vy > 30)
				this.p.vy = 30;
		},
		
		jump: function() {
		if(this.isAlive) {
				this.p.vy = -450;
				this.p.vx = -this.p.vx;
			}
		}

	});
	
	
	// Sprite Princess
	Q.Sprite.extend("Princess", {
		init: function(p) {
		
			this._super({
				asset: "princess.png",
				x: 2000,
				y: 350,
			});
		
			this.add("2d");
			this.end = false;
			this.on("bump.top,bump.left,bump.right,bump.bottom",this,"gana");
		},
		
		gana: function(collision) {
			if(collision.obj.isA("Mario") && !this.end) {
				this.end = true;
				Q.stageScene("endGame",1, { label: "You Won!" }); 
				Q.audio.stop();
				Q.audio.play("music_level_complete.mp3");
				collision.obj.animate({ x: this.p.x, y: (this.p.y - 50), angle: 360}, 3);
			}
		},
	
	});
	
	Q.Sprite.extend("Inicio", {
		init: function(p) {
			this._super({
				asset: "mainTitle.png",
				x: 0,
				y: 0,
			});
			
			Q.input.on("enter",this,"start");
		},
		
		start: function() {
			startGame();
		}
	});
	
	
	// HUD de las monedas
	Q.UI.Text.extend("Coins",{
		init: function(p) {
			this._super({
				label: "coins: 0",
				x: 60,
				y: 20
			});
			Q.state.on("change.coins",this,"coins");
		},
		
		coins: function(coins) {
			this.p.label = "coins: " + coins;
		}
	});
	
	
	// HUD de las vidas
	Q.UI.Text.extend("Lifes",{
		init: function(p) {
			this._super({
				label: "lifes: " + Q.state.get("lifes"),
				x: 250,
				y: 20
			});
			Q.state.on("change.lifes",this,"lifes");
		},
		
		lifes: function(lifes) {
			this.p.label = "lifes: " + lifes;
		}
	});
	
	////////////////////////////////////////////////////////////////////////////////////
	// Scene definition
	////////////////////////////////////////////////////////////////////////////////////
	Q.scene("hud", function(stage) {
		var coins = stage.insert(new Q.Coins());
		var lifes = stage.insert(new Q.Lifes());
	});
	
	Q.scene("endGame", function(stage) {
		 var container = stage.insert(new Q.UI.Container({
			x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
		  }));

		  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
														  label: "Play Again" }))         
		  var label = container.insert(new Q.UI.Text({x:10, y: -10 - button.p.h, 
														   label: stage.options.label }));
		  button.on("click",function() {
			volverAEmpezar()
		  });

		  container.fit(20);
	});
	
	// Hay que crear las escenas y ya luego cargar el tmx
	Q.scene("escenario",function(stage) {
		//stage.insert(new Q.Ball());
		
		// Cargamos el TMX y lo añadimos a la escena
		Q.loadTMX("levelOK.tmx", function() {
			Q.stageTMX("levelOK.tmx",stage);
			
			//Añadimos a mario a la escena
			var mario = stage.insert(new Q.Mario());
			
			var goomba = stage.insert(new Q.Goomba());
			goomba.p.x = 750;
			
			var goomba2 = stage.insert(new Q.Goomba());
			goomba2.p.x = 1000;
			
			var goomba3 = stage.insert(new Q.Goomba());
			goomba3.p.x = 1100;
			
			var goomba4 = stage.insert(new Q.Goomba());
			goomba4.p.x = 900;
			
			
			var bloopa = stage.insert(new Q.Bloopa());
			bloopa.p.x = 150;
			
			var bloopa2 = stage.insert(new Q.Bloopa());
			bloopa2.p.x = 250;
			
			var bloopa3 = stage.insert(new Q.Bloopa());
			bloopa3.p.x = 750;
			
			var bloopa4 = stage.insert(new Q.Bloopa());
			bloopa4.p.x = 860;
			
			
			
			var princess = stage.insert(new Q.Princess());
			
			
			var coin1 = stage.insert(new Q.Coin());
			coin1.setPos(350,480);
			
			var coin14 = stage.insert(new Q.Coin());
			coin14.setPos(375,470);
			
			var coin15 = stage.insert(new Q.Coin());
			coin15.setPos(400,460);
			
			var coin16 = stage.insert(new Q.Coin());
			coin16.setPos(425,450);
			
			var coin17 = stage.insert(new Q.Coin());
			coin17.setPos(450,440);
			
			var coin18 = stage.insert(new Q.Coin());
			coin18.setPos(475,430);
			
			var coin2 = stage.insert(new Q.Coin());
			coin2.setPos(500,420);
			
			var coin3 = stage.insert(new Q.Coin());
			coin3.setPos(525,430);
			
			var coin4 = stage.insert(new Q.Coin());
			coin4.setPos(550,440);
			
			var coin5 = stage.insert(new Q.Coin());
			coin5.setPos(575,450);
			
			var coin6 = stage.insert(new Q.Coin());
			coin6.setPos(600,460);
			
			var coin7 = stage.insert(new Q.Coin());
			coin7.setPos(625,470);
			
			var coin19 = stage.insert(new Q.Coin());
			coin19.setPos(650,480);
			
			var coin8 = stage.insert(new Q.Coin());
			coin8.setPos(1050,400);
			
			var coin9 = stage.insert(new Q.Coin());
			coin9.setPos(1150,400);
			
			var coin10 = stage.insert(new Q.Coin());
			coin10.setPos(1250,370);
			
			var coin11 = stage.insert(new Q.Coin());
			coin11.setPos(1350,350);
			
			var coin12 = stage.insert(new Q.Coin());
			coin12.setPos(1450,350);
			
			var coin13 = stage.insert(new Q.Coin());
			coin13.setPos(1550,370);
			
			
			
			
			stage.add("viewport").follow(mario,{x: true, y: false});
			stage.viewport.offsetX = -120;
			//stage.viewport.offsetY = 170;
			stage.viewport.y = 130;
		});		
	});
	
	Q.scene("inicio", function(stage) {
		var img = stage.insert(new Q.Inicio({ type: Q.SPRITE_UI }));
		
		 var container = stage.insert(new Q.UI.Container({
			x: 0, y: 0, fill: "rgba(0,0,0,0)", width: 500, height: 600
		  }));

		  var button = container.insert(new Q.UI.Button({ x: 0, y: 0,w: 500, h: 600,
														  label: "" }))         
		  button.on("click",function() {
			startGame()
		  });

		 //container.fit(20);
		  
		stage.add("viewport");
		stage.viewport.x = -160;
		stage.viewport.y = -240;
		
	});
	
	
	
	////////////////////////////////////////////////////////////////////////////////////
	// Load the game
	////////////////////////////////////////////////////////////////////////////////////
	
	
	// Cargamos el sheet mario_small
	Q.load(["mario_small.png","mario_small.json","goomba.png","goomba.json","bloopa.png","bloopa.json","princess.png","mainTitle.png","coin.png","coin.json","music_main.mp3","music_level_complete.mp3","music_die.mp3","coin.mp3"], function() {
	
		// this will create the sprite sheets sprite1name and sprite2name
		Q.compileSheets("mario_small.png","mario_small.json");
		Q.compileSheets("goomba.png","goomba.json");
		Q.compileSheets("bloopa.png","bloopa.json");
		Q.compileSheets("coin.png","coin.json");
		
		//Creamos las animaciones
		Q.animations('marioR', {
			derecha: { frames: [1,2,3,2], rate: 1/3, loop: true},
			izquierda: { frames: [15,16,17,16], rate: 1/3, loop: true},
			salto_derecha: { frames: [4], rate: 1/3, loop: true},
			salto_izquierda: { frames: [18], rate: 1/3, loop: true},
			quieto_derecha: { frames: [0], rate: 1/3, loop: true},
			quieto_izquierda: { frames: [14], rate: 1/3, loop: true},
			muerto: { frames: [12], rate: 1/3, loop: true}
		});
		
		Q.animations('goomba', {
			normal: { frames: [0,1], rate: 1/3, loop: true},
			aplastao: { frames: [2], rate: 1, loop: false, trigger: "muero"}
		
		});
		
		Q.animations('bloopa', {
			normal: { frames: [0], rate: 1, loop: true},
			aplastao: { frames: [1], rate: 1, loop: false, trigger: "muero"}
		
		});
		
		Q.animations('coin', {
			normal: { frames: [0,1,2], rate: 1/2, loop: true},
		});
		
		
		//Instanciamos la escena
		volverAEmpezar();
	});
	
	
}

function startGame() {
	Q.clearStages();
	Q.state.set("coins",0);
	Q.stageScene('escenario', 0);
	Q.stageScene("hud", 1);
	Q.audio.stop();
	Q.audio.play('music_main.mp3',{ loop: true });
}

function volverAEmpezar() {
	Q.audio.stop();
	Q.clearStages();
	Q.state.reset({ coins: 0 , lifes: 3});
	Q.stageScene('inicio', 0);
	Q.audio.play('music_main.mp3',{ loop: true });
}

function vidaFuera() {
	Q.audio.stop();
	Q.state.dec("lifes",1);
	if(Q.state.get("lifes") == 0) {
		//volverAEmpezar();
	}
	else{
		startGame();	
	}
		
}