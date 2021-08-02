var width = 1000;
var height = 1000;

let app = new PIXI.Application({width: width, height: height});
app.renderer.backgroundColor = 0xFFFFFF;

var graphics = new PIXI.Graphics();
	
document.body.appendChild(app.view);

var background = null;
var cc = null;
var bj = null;
var alex = null;

var playerX = width / 2;
var playerY = height / 2;

var nwX = width * 13/80;
var nwY = height * 13/80;

var neX = width * 65/80;
var neY = height * 13/80;

var sX = width / 2;
var sY = height * 70/80;

var nwPuddleX = width * 23/80;
var nwPuddleY = height * 32/80;

var nePuddleX = width * 57/80;
var nePuddleY = height * 32/80;

var swPuddleX = width * 23/80;
var swPuddleY = height * 48/80;

var sePuddleX = width * 57/80;
var sePuddleY = height * 48/80;

var playerVx = 0;
var playerVy = 0;

var bruteVx = 0;
var bruteVy = 0;

var cruiseVx = 0;
var cruiseVy = 0;

var hitboxSize = 30;

var rad = 10;

var playerYOffset = rad * 8;

var speed = 5;

var playerId = 1;

var bossReversal = true;

var puddleReversal = false;

var hitbox = null;

var arenaOutline;

var bruteBaitPlayerPos = [0, 0];

var puddleHitboxWest;
var puddleHitboxEast;
var puddleSize;


var chakramSize;

var nChakramX = width / 2;
var nChakramY = height * 4.5/80;

var eChakramX = width * 75.5/80;
var eChakramY = height / 2;

var wChakramX = width * 4.5/80;
var wChakramY = height / 2;

var chakramAOE1;
var chakramAOE2;

var state = 0;


var swBait = [255, 745];
var seBait = [745, 745];

var swPos = [240, 760];
var sePos = [760, 760];
var nwPos = [240, 240];
var nePos = [760, 240];

var wwnPos = [155, 355];
var eenPos = [845, 355];

var wwsPos = [155, 645];
var eesPos = [845, 645];

var ePos = [870, 515];
var wPos = [130, 515];

var wSacramentPos = [230, 755];
var eSacramentPos = [760, 755];

var wPuddle1Pos = [190, 500];
var ePuddle1Pos = [810, 500];

var wHighPuddle2Pos = [240, 455];
var wLowPuddle2Pos = [240, 545];
var eHighPuddle2Pos = [760, 455];
var eLowPuddle2Pos = [760, 545];

var wHighPuddle3Pos = [260, 425];
var wLowPuddle3Pos = [260, 575];
var eHighPuddle3Pos = [740, 425];
var eLowPuddle3Pos = [740, 575];

var stateToIdToPos = {};

	
PIXI.loader
  .add("img/bg.png")
  .add("img/cc.png")
  .add("img/bj.png")
  .add("img/alex.png")
  .load(setup);

function setup() {	
  background = new PIXI.Sprite(PIXI.loader.resources["img/bg.png"].texture);
  cc = new PIXI.Sprite(PIXI.loader.resources["img/cc.png"].texture);
  bj = new PIXI.Sprite(PIXI.loader.resources["img/bj.png"].texture);
  alex = new PIXI.Sprite(PIXI.loader.resources["img/alex.png"].texture);
  
  background.width = width * 0.8;
  background.height = height * 0.8;
  background.x = (width - background.width)/2;
  background.y = (height - background.height)/2;
  
  puddleSize = background.width / 2.6;
  chakramSize = background.width / 10;
  
  arenaOutline = new PIXI.Circle(width / 2, height / 2, background.width / 2);
  
  cc.width = width / 4;
  cc.height = height / 4;
  cc.visible = false;
  
  bj.width = width / 4;
  bj.height = height / 4;
  bj.visible = false;
  
  alex.width = width / 4;
  alex.height = height / 4;
  alex.rotation = Math.PI;
  alex.visible = false;
  
  playerId = Math.floor(Math.random() * 8) + 1;
  bossReversal = Math.floor(Math.random() * 2);
  puddleReversal = Math.floor(Math.random() * 2);
  
  initializePosMapping(bossReversal, puddleReversal);
  
  initializeKeyBindings();
  
  app.ticker.add(delta => tick(delta));
  
  app.stage.addChild(background);
  app.stage.addChild(cc);
  app.stage.addChild(bj);
  app.stage.addChild(alex);
  app.stage.addChild(graphics);
}

function tick(delta){
	graphics.clear();
	
	switch(state){
		// pre everything
		case 0:
			renderOutline();
			break;
			
		// boss positions/puddle positions and number are shown.
		case 1:
			cc.visible = true;
			bj.visible = true;
			alex.visible = true;
			initializeBossLocations(bossReversal);
		
			playerX += playerVx;
			playerY += playerVy;
			
			renderOutline();
			renderPuddles(puddleReversal);
			renderChakrams(bossReversal);
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			
			validatePosition();
			break;
			
		// chakrams are firing, cc disappears
		case 2:
			cc.visible = false;
			
			renderOutline();
			renderPuddles(puddleReversal);
			var shape1 = renderChakramAOE();
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			
			if(isHit(shape1, [])){
				state = -1;
			}
			
			break;
		
		// chakrams are done, move into position before brute jump/ #1 cleave.
		case 3:
			playerX += playerVx;
			playerY += playerVy;
		
			renderOutline();
			renderPuddles(puddleReversal);			
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);			
			
			validatePosition();
			break;
		
		// limit cut #1 goes off
		case 4:
			renderOutline();
			renderPuddles(puddleReversal);
			bruteJump(bossReversal);
			
			var shape1 = renderCruiseCleave(1);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);

			if(isHit(shape1, [1])){
				state = -1;
			}
			
			break;
			
		// limit cut #2 goes off, apocalytpic ray goes off.
		case 5:
			renderOutline();
			renderPuddles(puddleReversal);
			
			var shape1 = renderCruiseCharge(1, 2);
			var shape2 = renderBruteRay();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	

			if(isHit(shape1, [1, 2]) || isHit(shape2, [])){
				state = -1;
			}
			
			break;
		
		// movement period. right after #2 charge and apo ray starts.
		case 6:
			playerX += playerVx;
			playerY += playerVy;
		
			renderOutline();
			renderPuddles(puddleReversal);
			renderBruteRay();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);			
			
			validatePosition();
			break;
			
		// #3 goes off, first puddle resolves.
		case 7:
			renderOutline();
			
			var shape1 = renderPuddles(puddleReversal);
			
			// quick hack, make sure to check for the puddles sizes before they shrank
			shape1 = [new PIXI.Circle(shape1[0].x, shape1[0].y, shape1[0].radius * 2), new PIXI.Circle(shape1[1].x, shape1[1].y, shape1[1].radius * 2)]
			
			var shape2 = renderCruiseCleave(3);
			var shape3 = renderBruteRay();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	
			
			if(isHit(shape1, [5, 6]) || isHit(shape2, [3]) || isHit(shape3, [])){
				state = -1;
			}
			break;
			
		// #4 goes off.
		case 8:
			renderOutline();
			renderPuddles(puddleReversal);
			
			var shape1 = renderCruiseCharge(3, 4);
			var shape2 = renderBruteRay();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	
			
			if(isHit(shape1, [3, 4]) || isHit(shape2, [])){
				state = -1;
			}
			break;
			
		// movement period
		case 9:
			playerX += playerVx;
			playerY += playerVy;
			
			renderOutline();
			renderPuddles(puddleReversal);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	
			
			validatePosition();
			break;
		
		// #5 goes off, sacrament resolves, brute stops firing, second puddle resolves
		case 10:
			renderOutline();
			var shape1 = renderPuddles(puddleReversal);
			
			//quick hack, see above
			shape1 = [new PIXI.Circle(shape1[0].x, shape1[0].y, shape1[0].radius * 2), new PIXI.Circle(shape1[1].x, shape1[1].y, shape1[1].radius * 2)]
			
			var shape2 = renderCruiseCleave(5);
			var shape3 = renderSacrament();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	
			
			if(isHit(shape1, [7, 8]), isHit(shape2, [5]), isHit(shape3, [])){
				state = -1;
			}
			
			break;
			
		// #6 goes off
		case 11:
			renderOutline();
			renderPuddles(puddleReversal);
			
			var shape1 = renderCruiseCharge(5, 6);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);	
			
			if(isHit(shape1, [5, 6])){
				state = -1;
			}
			
			break;
			
		// movement period
		case 12:			
			playerX += playerVx;
			playerY += playerVy;
		
			renderOutline();
			renderPuddles(puddleReversal);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			validatePosition();
			break;	
			
		// #7 goes off, third puddle resolves
		case 13:			
			renderOutline();
			
			var shape1 = renderCruiseCleave(7);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			
			if(isHit(shape1, [7])){
				state = -1;
			}
			
			break;	
			
		// 8 goes off
		case 14:
			renderOutline();
			
			var shape1 = renderCruiseCharge(7, 8);
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			
			if(isHit(shape1, [7, 8])){
				state = -1;
			}
			
			break;	
			
		// movement period
		case 15:
			playerX += playerVx;
			playerY += playerVy;
		
			renderOutline();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			validatePosition();
			break;	
			
		// stack resolves, done
		case 16:
			renderOutline();
			
			renderNPCs();
			renderPlayer(playerId, playerX, playerY, rad);
			break;	
			
		// fail state
		case -1:
			alert("You Failed!");
			state = 0;
			break;
			
		default:
			alert("Done");
			break;
	}
}

function initializePosMapping(bossReversed, puddleReversed){
	// bossReversed -> BJ NE, CC NW
	// puddleReversed -> NW, SE 
	
	stateToIdToPos[0] = {};
	stateToIdToPos[1] = {};
	stateToIdToPos[2] = {};
	stateToIdToPos[3] = {};
	stateToIdToPos[4] = {};
	stateToIdToPos[5] = {};
	stateToIdToPos[6] = {};
	stateToIdToPos[7] = {};
	stateToIdToPos[8] = {};
	stateToIdToPos[9] = {};
	stateToIdToPos[10] = {};
	stateToIdToPos[11] = {};
	stateToIdToPos[12] = {};
	stateToIdToPos[13] = {};
	stateToIdToPos[14] = {};
	stateToIdToPos[15] = {};
	stateToIdToPos[16] = {};
	
	for(var i = 1; i <= 8; i++){
		stateToIdToPos[0][i] = [width/2, height/2];
	}
	
	for(var i = 1; i <= 2; i++){	
		if(bossReversal){
			stateToIdToPos[i][1] = nwPos;
			stateToIdToPos[i][2] = sePos;
			stateToIdToPos[i][3] = nePos;
			stateToIdToPos[i][4] = swBait;
			stateToIdToPos[i][5] = wwnPos;
			stateToIdToPos[i][6] = eenPos;
			stateToIdToPos[i][7] = wwnPos;
			stateToIdToPos[i][8] = eenPos;
			
		}else{
			stateToIdToPos[i][1] = nePos;
			stateToIdToPos[i][2] = swPos;
			stateToIdToPos[i][3] = nwPos;
			stateToIdToPos[i][4] = seBait;
			stateToIdToPos[i][5] = eenPos;
			stateToIdToPos[i][6] = wwnPos;
			stateToIdToPos[i][7] = eenPos;
			stateToIdToPos[i][8] = wwnPos;
		}
	}
	
	stateToIdToPos[3][1] = stateToIdToPos[2][1];
	stateToIdToPos[3][2] = stateToIdToPos[2][2];
	stateToIdToPos[3][3] = stateToIdToPos[2][3];
	stateToIdToPos[3][4] = stateToIdToPos[2][4];
	
	if(bossReversal){
		stateToIdToPos[3][5] = wPuddle1Pos;
		stateToIdToPos[3][6] = ePuddle1Pos;
		stateToIdToPos[3][7] = wPos;
		stateToIdToPos[3][8] = ePos;
	}else{
		stateToIdToPos[3][5] = ePuddle1Pos;
		stateToIdToPos[3][6] = wPuddle1Pos;
		stateToIdToPos[3][7] = ePos;
		stateToIdToPos[3][8] = wPos;
	}
	
	stateToIdToPos[4][1] = stateToIdToPos[3][1];
	stateToIdToPos[4][2] = stateToIdToPos[3][2];
	stateToIdToPos[4][3] = stateToIdToPos[3][3];
	stateToIdToPos[4][4] = stateToIdToPos[3][4];
	stateToIdToPos[4][5] = stateToIdToPos[3][5];
	stateToIdToPos[4][6] = stateToIdToPos[3][6];
	stateToIdToPos[4][7] = stateToIdToPos[3][7];
	stateToIdToPos[4][8] = stateToIdToPos[3][8];
	
	stateToIdToPos[5][1] = stateToIdToPos[4][1];
	stateToIdToPos[5][2] = stateToIdToPos[4][2];
	stateToIdToPos[5][3] = stateToIdToPos[4][3];
	stateToIdToPos[5][4] = stateToIdToPos[4][4];
	stateToIdToPos[5][5] = stateToIdToPos[4][5];
	stateToIdToPos[5][6] = stateToIdToPos[4][6];
	stateToIdToPos[5][7] = stateToIdToPos[4][7];
	stateToIdToPos[5][8] = stateToIdToPos[4][8];
	
	if(bossReversal){
		stateToIdToPos[6][1] = wPos;
		stateToIdToPos[6][2] = ePos;
		stateToIdToPos[6][4] = wSacramentPos;
		
	}else{
		stateToIdToPos[6][1] = ePos;
		stateToIdToPos[6][2] = wPos;
		stateToIdToPos[6][4] = eSacramentPos;
		
	}
	stateToIdToPos[6][3] = stateToIdToPos[5][3];
	stateToIdToPos[6][5] = stateToIdToPos[5][5];
	stateToIdToPos[6][6] = stateToIdToPos[5][6];
	stateToIdToPos[6][7] = stateToIdToPos[5][7];
	stateToIdToPos[6][8] = stateToIdToPos[5][8];
	
	stateToIdToPos[7][1] = stateToIdToPos[6][1];
	stateToIdToPos[7][2] = stateToIdToPos[6][2];
	stateToIdToPos[7][3] = stateToIdToPos[6][3];
	stateToIdToPos[7][4] = stateToIdToPos[6][4];
	stateToIdToPos[7][5] = stateToIdToPos[6][5];
	stateToIdToPos[7][6] = stateToIdToPos[6][6];
	stateToIdToPos[7][7] = stateToIdToPos[6][7];
	stateToIdToPos[7][8] = stateToIdToPos[6][8];
	
	stateToIdToPos[8][1] = stateToIdToPos[7][1];
	stateToIdToPos[8][2] = stateToIdToPos[7][2];
	stateToIdToPos[8][3] = stateToIdToPos[7][3];
	stateToIdToPos[8][4] = stateToIdToPos[7][4];
	stateToIdToPos[8][5] = stateToIdToPos[7][5];
	stateToIdToPos[8][6] = stateToIdToPos[7][6];
	stateToIdToPos[8][7] = stateToIdToPos[7][7];
	stateToIdToPos[8][8] = stateToIdToPos[7][8];
	
	
	// first puddle soaked, #4 charge done.
	// 1/2/3/4 stay. 
	// 5 -> away from puddle, bait cleave
	// 6 -> away from puddle, bait charge
	// 7 -> into puddle
	// 8 -> into puddle
	// bossReversed -> BJ NE, CC NW
	// puddleReversed -> NW, SE 
	
	stateToIdToPos[9][1] = stateToIdToPos[8][1];
	stateToIdToPos[9][2] = stateToIdToPos[8][2];
	stateToIdToPos[9][3] = stateToIdToPos[8][3];
	stateToIdToPos[9][4] = stateToIdToPos[8][4];
	
	if(bossReversal){
		//BJ: NE, CC: NW
		
		if(puddleReversal){
			// Puddles: NW, SE
			stateToIdToPos[9][5] = wwsPos;
			stateToIdToPos[9][6] = eenPos;
			stateToIdToPos[9][7] = wHighPuddle2Pos;
			stateToIdToPos[9][8] = eLowPuddle2Pos;
			
		}else{
			// Puddles: NE, SW
			stateToIdToPos[9][5] = wwnPos;
			stateToIdToPos[9][6] = eesPos;
			stateToIdToPos[9][7] = wLowPuddle2Pos;
			stateToIdToPos[9][8] = eHighPuddle2Pos;
		}
	}else{
		//BJ: NW, CC; NE
		
		if(puddleReversal){
			// Puddles: NW, SE
			stateToIdToPos[9][5] = eenPos;
			stateToIdToPos[9][6] = wwsPos;
			stateToIdToPos[9][7] = eLowPuddle2Pos;
			stateToIdToPos[9][8] = wHighPuddle2Pos;
		}else{
			// Puddles: NE, SW
			stateToIdToPos[9][5] = eesPos;
			stateToIdToPos[9][6] = wwnPos;
			stateToIdToPos[9][7] = eHighPuddle2Pos;
			stateToIdToPos[9][8] = wLowPuddle2Pos;
		}
		
	}
	
	stateToIdToPos[10][1] = stateToIdToPos[9][1];
	stateToIdToPos[10][2] = stateToIdToPos[9][2];
	stateToIdToPos[10][3] = stateToIdToPos[9][3];
	stateToIdToPos[10][4] = stateToIdToPos[9][4];
	stateToIdToPos[10][5] = stateToIdToPos[9][5];
	stateToIdToPos[10][6] = stateToIdToPos[9][6];
	stateToIdToPos[10][7] = stateToIdToPos[9][7];
	stateToIdToPos[10][8] = stateToIdToPos[9][8];
	
	stateToIdToPos[11][1] = stateToIdToPos[10][1];
	stateToIdToPos[11][2] = stateToIdToPos[10][2];
	stateToIdToPos[11][3] = stateToIdToPos[10][3];
	stateToIdToPos[11][4] = stateToIdToPos[10][4];
	stateToIdToPos[11][5] = stateToIdToPos[10][5];
	stateToIdToPos[11][6] = stateToIdToPos[10][6];
	stateToIdToPos[11][7] = stateToIdToPos[10][7];
	stateToIdToPos[11][8] = stateToIdToPos[10][8];
	
	// #7 goes off, third puddle resolves about to happen
	stateToIdToPos[12][3] = stateToIdToPos[10][3];
	stateToIdToPos[12][4] = stateToIdToPos[10][4];
	
	if(bossReversal){
		//BJ: NE, CC: NW
		
		if(puddleReversal){
			// Puddles: NW, SE
			stateToIdToPos[12][5] = wPos;
			stateToIdToPos[12][6] = ePos;
			stateToIdToPos[12][7] = wwsPos;
			stateToIdToPos[12][8] = eenPos;	
			stateToIdToPos[12][1] = wHighPuddle3Pos;
			stateToIdToPos[12][2] = eLowPuddle3Pos;
			
		}else{
			// Puddles: NE, SW
			stateToIdToPos[12][5] = wPos;
			stateToIdToPos[12][6] = ePos;
			stateToIdToPos[12][7] = wwnPos;
			stateToIdToPos[12][8] = eesPos;			
			stateToIdToPos[12][1] = wLowPuddle3Pos;
			stateToIdToPos[12][2] = eHighPuddle3Pos;
		}
	}else{
		//BJ: NW, CC; NE
		
		if(puddleReversal){
			// Puddles: NW, SE
			stateToIdToPos[12][5] = ePos;
			stateToIdToPos[12][6] = wPos;
			stateToIdToPos[12][7] = eenPos;
			stateToIdToPos[12][8] = wwsPos;
			stateToIdToPos[12][1] = eLowPuddle3Pos;
			stateToIdToPos[12][2] = wHighPuddle3Pos;
		}else{
			// Puddles: NE, SW
			stateToIdToPos[12][5] = ePos;
			stateToIdToPos[12][6] = wPos;
			stateToIdToPos[12][7] = eesPos;
			stateToIdToPos[12][8] = wwnPos;
			stateToIdToPos[12][1] = eHighPuddle3Pos;
			stateToIdToPos[12][2] = wLowPuddle3Pos;
		}
		
	}
	
	stateToIdToPos[13][1] = stateToIdToPos[12][1];
	stateToIdToPos[13][2] = stateToIdToPos[12][2];
	stateToIdToPos[13][3] = stateToIdToPos[12][3];
	stateToIdToPos[13][4] = stateToIdToPos[12][4];
	stateToIdToPos[13][5] = stateToIdToPos[12][5];
	stateToIdToPos[13][6] = stateToIdToPos[12][6];
	stateToIdToPos[13][7] = stateToIdToPos[12][7];
	stateToIdToPos[13][8] = stateToIdToPos[12][8];
	
	stateToIdToPos[14][1] = stateToIdToPos[13][1];
	stateToIdToPos[14][2] = stateToIdToPos[13][2];
	stateToIdToPos[14][3] = stateToIdToPos[13][3];
	stateToIdToPos[14][4] = stateToIdToPos[13][4];
	stateToIdToPos[14][5] = stateToIdToPos[13][5];
	stateToIdToPos[14][6] = stateToIdToPos[13][6];
	stateToIdToPos[14][7] = stateToIdToPos[13][7];
	stateToIdToPos[14][8] = stateToIdToPos[13][8];
	
	stateToIdToPos[15][1] = [width/2, height/2];
	stateToIdToPos[15][2] = [width/2, height/2];
	stateToIdToPos[15][3] = [width/2, height/2];
	stateToIdToPos[15][4] = [width/2, height/2];
	stateToIdToPos[15][5] = [width/2, height/2];
	stateToIdToPos[15][6] = [width/2, height/2];
	stateToIdToPos[15][7] = [width/2, height/2];
	stateToIdToPos[15][8] = [width/2, height/2];
	
	stateToIdToPos[16][1] = stateToIdToPos[15][1];
	stateToIdToPos[16][2] = stateToIdToPos[15][2];
	stateToIdToPos[16][3] = stateToIdToPos[15][3];
	stateToIdToPos[16][4] = stateToIdToPos[15][4];
	stateToIdToPos[16][5] = stateToIdToPos[15][5];
	stateToIdToPos[16][6] = stateToIdToPos[15][6];
	stateToIdToPos[16][7] = stateToIdToPos[15][7];
	stateToIdToPos[16][8] = stateToIdToPos[15][8];
}

function render(shape){
	graphics.lineStyle(5, 0xFFFFFF);
	graphics.beginFill(0xfc9803);
	graphics.drawShape(shape);
	
	graphics.endFill();
	
	return shape;
}

function move(src_x, src_y, dest_x, dest_y, speed){
	temp_x = src_x;
	temp_y = src_y;
	
	if(src_x > dest_x){
		if(src_x - speed >= dest_x){
			temp_x -= speed;
		}
		
	}else if (src_x < dest_x){
		if(src_x + speed <= dest_x){
			temp_x += speed;
		}
	}
	
	if(src_y > dest_y){
		if(src_y - speed >= dest_y){
			temp_y -= speed;
		}
		
	}else if(src_y < dest_y){
		if(src_y + speed <= dest_y){
			temp_y += speed;
		}
		
	}
	return [temp_x, temp_y];
}

function bruteJump(isReversed){
	var val = move(bj.x, bj.y, bruteBaitPlayerPos[0] - bj.width/2, bruteBaitPlayerPos[1] - bj.height/2, 15);
	
	bruteVx = bj.x - val[0];
	bruteVy = bj.y - val[1];
	
	bj.x = val[0];
	bj.y = val[1];
}

function setPlayerIdFurthestFromBrute(state){
	
	var val = 0;
	var id = [0, 0];
	
	for(var i = 1; i <= 8; i++){
		var x, y;
		
		if(i == playerId){
			x = playerX;
			y = playerY;
		}else{
			x = stateToIdToPos[state][i][0];
			y = stateToIdToPos[state][i][1];
		}
		var tempVal = Math.sqrt(Math.pow(x - (bj.x + bj.width/2), 2) + Math.pow(y - (bj.y + bj.height/2), 2));
		
		if(tempVal > val){
			actualId = i;
			val = tempVal;
			id = [x, y];
		}
	}
	bruteBaitPlayerPos = id;
	
}

function isHit(shapes, excludedPlayers){
	
	var hit = false;
	
	for(var i = 1; i <= 8; i++){
		if(excludedPlayers.includes(i)){
			continue;
		}
		
		var x, y;
		
		if(i == playerId){
			x = playerX + hitboxSize / 2;
			y = playerY + hitboxSize / 2;
			
		}else{
			x = stateToIdToPos[state][i][0];
			y = stateToIdToPos[state][i][1];
			
		}
		
		for(const shape of shapes){
			if(shape.contains(x, y)){
				console.log(i + " got hit by " + shape);
			}
			
			hit = hit || shape.contains(x, y);
			
		}
	}
	return hit;
}

function renderSacrament(){
	var rect1 = new PIXI.Rectangle(width/2 - 100, 0, 200, height - 200);
	var rect2 = new PIXI.Rectangle(0, height-240, width, 200);
	
	graphics.lineStyle(5, 0x097e4f7);
	graphics.beginFill(0xafebfa);
	graphics.drawShape(rect1);
	graphics.drawShape(rect2);
	graphics.endFill();
	
	return [rect1, rect2];
}

function renderCruiseCleave(id){
	var x, y;
	
	if(id == playerId){
		x = playerX;
		y = playerY;
	}else{
		x = stateToIdToPos[state][id][0];
		y = stateToIdToPos[state][id][1];
	}
	
	return renderCleave(width/2, height/2, x, y, 400, 700);
	
}

function renderCruiseCharge(src_id, dest_id){
	
	var src_x;
	var src_y;
	var dest_x;
	var dest_y;
	
	
	if(src_id == playerId){
		src_x = playerX;
		src_y = playerY;
		
		dest_x = stateToIdToPos[state][dest_id][0];
		dest_y = stateToIdToPos[state][dest_id][1];
		
	}else if(dest_id == playerId){
		dest_x = playerX;
		dest_y = playerY;
		
		src_x = stateToIdToPos[state][src_id][0];
		src_y = stateToIdToPos[state][src_id][1];
		
	}else{
		src_x = stateToIdToPos[state][src_id][0];
		src_y = stateToIdToPos[state][src_id][1];
		
		dest_x = stateToIdToPos[state][dest_id][0];
		dest_y = stateToIdToPos[state][dest_id][1];
	}
	
	var width_c = 100;
	
	var center = [width/2, height/2];
	
	var alpha = Math.atan2(height - src_y - center[1], src_x - center[0]);
	
	var projectedSrcPos1 = [src_x + width_c * Math.cos(Math.PI/2 - alpha), src_y + width_c * Math.sin(Math.PI/2 - alpha)];
	var projectedSrcPos2 = [src_x + width_c * Math.cos(Math.PI/2 + alpha), src_y + width_c * -Math.sin(Math.PI/2 + alpha)];
	
	var projectedDestPos1 = [dest_x + width_c * Math.cos(Math.PI/2 - alpha), dest_y + width_c * Math.sin(Math.PI/2 - alpha)];
	var projectedDestPos2 = [dest_x + width_c * Math.cos(Math.PI/2 + alpha), dest_y + width_c * -Math.sin(Math.PI/2 + alpha)];
	
	var polygon = new PIXI.Polygon([
						projectedSrcPos1[0], projectedSrcPos1[1], 
						projectedDestPos1[0], projectedDestPos1[1], 
						projectedDestPos2[0], projectedDestPos2[1], 
						projectedSrcPos2[0], projectedSrcPos2[1],
						projectedSrcPos1[0], projectedSrcPos1[1]]);
	
	graphics.lineStyle(5, 0xcc6600);
	graphics.beginFill(0xff8c1a);
	graphics.drawShape(polygon);
						
	graphics.endFill();
	
	return [polygon];
}

function renderBruteRay(){
	var center = [bj.x + bj.width / 2, bj.y + bj.height / 2];
	
	var alpha = Math.atan2(height - bruteBaitPlayerPos[1] - width/2, bruteBaitPlayerPos[0] - height/2);
	
	var projectedPos = [center[0] + 600 * Math.cos(alpha), center[1] + 600 * -Math.sin(alpha)];
	
	var projectedPosP1 = [projectedPos[0] + 200 * Math.cos(Math.PI/2 - alpha), projectedPos[1] + 200 * Math.sin(Math.PI/2 - alpha)];
	var projectedPosP2 = [projectedPos[0] + 200 * Math.cos(Math.PI/2 + alpha), projectedPos[1] + 200 * -Math.sin(Math.PI/2 + alpha)];
	
	var polygon = new PIXI.Polygon([center[0], center[1], projectedPosP1[0], projectedPosP1[1], projectedPosP2[0],projectedPosP2[1], center[0], center[1]]);
	
	graphics.lineStyle(5, 0xcc6600);
	graphics.beginFill(0xff8c1a);
	graphics.drawShape(polygon);
	graphics.endFill();
	
	return [polygon];
}

function renderCleave(center_x, center_y, x, y, height_c, width_c){
	var center = [center_x, center_y];
	
	var alpha = Math.atan2(height - y - center[1], x - center[0]);
	
	var projectedPos = [x + height_c * Math.cos(alpha), y + height_c * -Math.sin(alpha)];
	
	var projectedPosP1 = [projectedPos[0] + width_c/2 * Math.cos(Math.PI/2 - alpha), projectedPos[1] + width_c/2 * Math.sin(Math.PI/2 - alpha)];
	var projectedPosP2 = [projectedPos[0] + width_c/2 * Math.cos(Math.PI/2 + alpha), projectedPos[1] + width_c/2 * -Math.sin(Math.PI/2 + alpha)];
	
	var polygon = new PIXI.Polygon([x, y, projectedPosP1[0], projectedPosP1[1], projectedPosP2[0],projectedPosP2[1], x, y]);
	
	graphics.lineStyle(5, 0xcc6600);
	graphics.beginFill(0xff8c1a);
	graphics.drawShape(polygon);
	graphics.endFill();
	
	return [polygon];
}

function rectIntersects(rect1, rect2){
	if (rect1.contains(rect2.x, rect2.y) || 
		rect1.contains(rect2.x + rect2.width, rect2.y) || 
		rect1.contains(rect2.x + rect2.width, rect2.y + rect2.height) || 
		rect1.contains(rect2.x, rect2.y + rect2.height)){
		return true;
	}
    return false;
	
}

function advanceState(){
	if(bruteVx != 0 || bruteVy != 0){
		return;
	}
	
	state++;
	
	if(state == 3 || state == 5){
		setPlayerIdFurthestFromBrute(state - 1);
	}
	
	if(state == 7 || state == 10){
		if(state == 7 && isHit([puddleHitboxWest], [1, 2, 3, 4, 7, 8]) && isHit([puddleHitboxEast], [1, 2, 3, 4, 7, 8])){
			puddleSize /= 2;
			return;
		}
		
		if(state == 10 && isHit([puddleHitboxWest], [1, 2, 3, 4, 5, 6]) && isHit([puddleHitboxEast], [1, 2, 3, 4, 5, 6])){
			puddleSize /= 2;
			return;
		}
		
		if(state == 13 && isHit([puddleHitboxWest], [3, 4, 5, 6, 7, 8]) && isHit([puddleHitboxEast], [3, 4, 5, 6, 7, 8])){
			return;
		}
		
		state = -1;
	}
}

function renderChakramAOE(){
	chakramAOE1 = new PIXI.Rectangle(nChakramX - chakramSize / 2, 0, chakramSize, height);
	
	chakramAOE2 = new PIXI.Rectangle(0, eChakramY - chakramSize / 2, width, chakramSize);

	
	graphics.lineStyle(5, 0xcc6600);
	graphics.beginFill(0xff8c1a);
	graphics.drawShape(chakramAOE1);
	graphics.drawShape(chakramAOE2);
	graphics.endFill();
	return [chakramAOE1, chakramAOE2];
	
}

function renderOutline(){
	graphics.lineStyle(20, 0x00000);
	
	graphics.moveTo(0, 0);
	graphics.lineTo(width, 0);
	graphics.lineTo(width, height);
	graphics.lineTo(0, height);
	graphics.lineTo(0, 0);
	
}

function renderChakrams(isReversed){
	var chakram1 = new PIXI.Circle(nChakramX, nChakramY, chakramSize / 2);
	
	var chakram2;
	
	if(isReversed){
		chakram2 = new PIXI.Circle(eChakramX, eChakramY, chakramSize / 2);
		
	}else{
		chakram2 = new PIXI.Circle(wChakramX, wChakramY, chakramSize / 2);
	}
	
	graphics.lineStyle(5, 0x996600);
	graphics.beginFill(0xcc8800);
	graphics.drawShape(chakram1);
	graphics.drawShape(chakram2);
	graphics.endFill();
	
}

function renderPuddles(isReversed){
	if(isReversed){
		puddleHitboxWest = new PIXI.Circle(nwPuddleX, nwPuddleY, puddleSize / 2);
		puddleHitboxEast = new PIXI.Circle(sePuddleX, sePuddleY, puddleSize / 2);
	}else{
		puddleHitboxWest = new PIXI.Circle(swPuddleX, swPuddleY, puddleSize / 2);
		puddleHitboxEast = new PIXI.Circle(nePuddleX, nePuddleY, puddleSize / 2);
	}
			
	graphics.lineStyle(10, 0x400080);
	graphics.beginFill(0x6600cc);
	graphics.drawShape(puddleHitboxWest);
	graphics.drawShape(puddleHitboxEast)
	graphics.endFill();
	
	return [puddleHitboxWest, puddleHitboxEast];
	
}

function initializeBossLocations(isReversed){
	if(isReversed){
		cc.x = nwX - cc.width / 2;
		cc.y = nwY - cc.height / 2;
		
		bj.x = neX - bj.width / 2;
		bj.y = neY - bj.height / 2;
		
	}else{
		cc.x = neX - cc.width / 2;
		cc.y = neY - cc.height / 2;
		
		bj.x = nwX - bj.width / 2;
		bj.y = nwY - bj.height / 2;
	}
	
	alex.x = sX + alex.width / 2;
	alex.y = sY + alex.height / 2;
}

function initializeKeyBindings(){
	let left = keyboard("ArrowLeft"),
		up = keyboard("ArrowUp"),
		right = keyboard("ArrowRight"),
		down = keyboard("ArrowDown");

	  left.press = () => {
			playerVx = -speed;
	  };
	  
	  left.release = () => {
			playerVx = 0;
		
	  };

	  up.press = () => {
			playerVy = -speed;
	  };
	  up.release = () => {
			playerVy = 0;
		
	  };

	  right.press = () => {
			playerVx = speed;
	  };
	  
	  right.release = () => {
			playerVx = 0;
		
	  };
	  
	  down.press = () => {
			playerVy = speed;
	  };
	  
	  down.release = () => {
			playerVy = 0;
		
	  };

}

function keyboard(value) {
	  let key = {};
	  key.value = value;
	  key.isDown = false;
	  key.isUp = true;
	  key.press = undefined;
	  key.release = undefined;
	  
	  key.downHandler = event => {
		if (event.key === key.value) {
		  if (key.isUp && key.press) key.press();
		  key.isDown = true;
		  key.isUp = false;
		  event.preventDefault();
		}
	  };

	  key.upHandler = event => {
		if (event.key === key.value) {
		  if (key.isDown && key.release) key.release();
		  key.isDown = false;
		  key.isUp = true;
		  event.preventDefault();
		}
	  };

	  //Attach event listeners
	  const downListener = key.downHandler.bind(key);
	  const upListener = key.upHandler.bind(key);
	  
	  window.addEventListener(
		"keydown", downListener, false
	  );
	  window.addEventListener(
		"keyup", upListener, false
	  );
	  
	  // Detach event listeners
	  key.unsubscribe = () => {
		window.removeEventListener("keydown", downListener);
		window.removeEventListener("keyup", upListener);
	  };
	  
	  return key;
}

function validatePosition(){
	
	var bounds = arenaOutline.getBounds();
	
	var centerX = bounds.x + bounds.width / 2;
	var centerY = bounds.y + bounds.height / 2;
	
	if(	circleContainsPoint(hitbox.x, hitbox.y, centerX, centerY, bounds.width / 2) && 
		circleContainsPoint(hitbox.x + hitbox.width, hitbox.y, centerX, centerY, bounds.width / 2) &&
		circleContainsPoint(hitbox.x + hitbox.width, hitbox.y + hitbox.height, centerX, centerY, bounds.width / 2) &&
		circleContainsPoint(hitbox.x, hitbox.y + hitbox.height, centerX, centerY, bounds.width / 2)) {
		
		return;
	}
	
	playerX -= playerVx;
	playerY -= playerVy;
}

function circleContainsPoint(x, y, center_x, center_y, rad){
	return Math.pow((x - center_x), 2) + Math.pow((y - center_y), 2) < Math.pow(rad, 2);
	
}

function renderNPCs(){
	for(var i = 1; i <= 8; i++){
		if(i == playerId){
			continue;
		}
		
		var npcHitbox = new PIXI.Circle(stateToIdToPos[state][i][0], stateToIdToPos[state][i][1], hitboxSize / 2);
		
		graphics.lineStyle(5, 0xFFFFFF);
		graphics.beginFill(0xfc9803);
		graphics.drawShape(npcHitbox);
		
		graphics.endFill();
		
		renderLimitCutNumberById(i, stateToIdToPos[state][i][0], stateToIdToPos[state][i][1], rad);
		
	}
}

// renders the player at the given coordinates with the given
// radius. the player simply being a collection of dots signifying
// their limit cut number.
function renderPlayer(id, x, y, rad){
			
	hitbox = new PIXI.Rectangle(x - hitboxSize / 2, y - hitboxSize / 2, hitboxSize, hitboxSize)
			
	graphics.lineStyle(5, 0xFFFFFF);
	graphics.beginFill(0xfc9803);
	graphics.drawShape(hitbox);
	
	graphics.endFill();

	renderLimitCutNumberById(id, x, y, rad);
}

function renderLimitCutNumberById(id, x, y, rad){
	var color;
	
	var offset = rad + (rad / 2);
	
	if(id % 2 == 0){
		// evens, color red
		color = 0xf20909;
		
	}else{
		// odds, color blue
		color = 0x0930f2;
	}
	
	
	graphics.lineStyle(5, color);
	
	graphics.beginFill(color);
	
	switch(id){
		case 1:
			graphics.drawCircle(x, y - playerYOffset, rad);
		break;
		case 2:
			graphics.drawCircle(x - offset, y - playerYOffset, rad);
			graphics.drawCircle(x + offset, y - playerYOffset, rad);
		break;
		case 3:
			graphics.drawCircle(x - offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x, y - offset - playerYOffset, rad);
		break;
		case 4:
			graphics.drawCircle(x - offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x - offset, y - offset - playerYOffset, rad);
		break;
		case 5:
			graphics.drawCircle(x - 2 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x, y + offset - playerYOffset, rad);
			graphics.drawCircle(x, y - offset - playerYOffset, rad);
			graphics.drawCircle(x - 2 * offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + 2 * offset, y - playerYOffset, rad);
		break;
		case 6:
			graphics.drawCircle(x - 2 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x, y + offset - playerYOffset, rad);
			graphics.drawCircle(x, y - offset - playerYOffset, rad);
			graphics.drawCircle(x - 2 * offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + 2 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + 2 * offset, y - offset - playerYOffset, rad);
		break;
		case 7:
			graphics.drawCircle(x - 3 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x - offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x - offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x - 3 * offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + 3 * offset, y - playerYOffset, rad);
		break;
		case 8:
			graphics.drawCircle(x - 3 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x - offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x - offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x - 3 * offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + offset, y - offset - playerYOffset, rad);
			graphics.drawCircle(x + 3 * offset, y + offset - playerYOffset, rad);
			graphics.drawCircle(x + 3 * offset, y - offset - playerYOffset, rad);
		break;
	}	
	graphics.endFill();
}