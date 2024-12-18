let playerX, playerY;
let whales = [];
let coins = [];
let corals = [];
let rocks = [];
let coinCount = 20;
let coralCount = 3;
let rockCount = 5;

let heldCoins = 0;
let coinPrice = 1.0;
let realizedGains = 0;
let averageBuyPrice = 0;
let isBullMarket = true;
let marketToggleTimer = 0;
let exchangeMoveTimer = 0;

let isGameOver = false;
let inExchangeZone = false;
let isPaused = false;

let upPressed = false, downPressed = false, leftPressed = false, rightPressed = false;

let whaleSpeed = 0.7;
let speedIncrement = 0.05;
let maxDistance = 600;

let exchangeX, exchangeY, exchangeSize = 100;

let shrimpLeft, shrimpRight;
let whaleLeftImg, whaleRightImg;
let coinGif; 
let myFont;

class FloatingMessage {
  constructor(t, x, y, f) {
    this.text = t;
    this.x = x;
    this.y = y;
    this.frames = f;
  }
}
let messages = [];

let coinSound;
let gameOverSound;
let tracks = ["track1.mp3", "track2.mp3", "track3.mp3"];
let trackSounds = [];
let currentTrack = 0;
let bgMusic = null;

let vanishY; 
let numHorizontalLines = 20;   
let numVerticalLines = 10;     

function preload() {
  myFont = loadFont("neodgm.ttf");
  shrimpLeft = loadImage("shrimp-left.png");
  shrimpRight = loadImage("shrimp-right.png");
  whaleLeftImg = loadImage("whale-left.png");
  whaleRightImg = loadImage("whale-right.png");
  coinGif = loadImage("coin.gif");

  coinSound = loadSound("coin.mp3");
  gameOverSound = loadSound("gameover.mp3");
  
  for (let i = 0; i < tracks.length; i++) {
    trackSounds[i] = loadSound(tracks[i]);
  }
}

function setup() {
  createCanvas(1200, 800);
  textFont(myFont);
  vanishY = height / 2.0;
  resetGame();
}

function draw() {
  if (isGameOver) {
    drawBackgroundGrid();
    drawEnvironment(false);

    fill(0,0,0,128);
    noStroke();
    rect(0,0,width,height);

    textAlign(CENTER, CENTER);
    textSize(36);
    fill(255, 0, 0);
    text("Game Over", width / 2, height / 2 - 20);
    textSize(18);
    fill(255);
    text("Press 'R' to Restart", width / 2, height / 2 + 20);
    return;
  }

  if (!isPaused) {
    if (frameCount - marketToggleTimer > 600) {
      isBullMarket = !isBullMarket;
      marketToggleTimer = frameCount;

      if (isBullMarket) {
        spawnWhale();
        spawnWhale();
        whaleSpeed = 0.7;
      } else {
        if (whales.length > 2) {
          whales.pop();
        }
        whaleSpeed = 1.0;
      }
    }

    if (isBullMarket && frameCount - exchangeMoveTimer > 900) {
      moveExchange();
      exchangeMoveTimer = frameCount;
    }

    if (frameCount % 120 == 0) {
      coinPrice = random(0.5, 3.0);
    }
  }

  drawBackgroundGrid();

  if (bgMusic && !bgMusic.isPlaying() && !isGameOver && !isPaused) {
    bgMusic.play();
  }
  if (bgMusic && bgMusic.isPlaying() && bgMusic.duration() - bgMusic.currentTime() < 0.1) {
    changeTrack((currentTrack + 1) % tracks.length);
  }

  drawEnvironment(true);

  if (isPaused) {
    drawingContext.filter = 'blur(3px)'; 
    fill(0,0,0,64);
    noStroke();
    rect(0,0,width,height);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(36);
    text("Game Paused", width/2, height/2 - 40);
    textSize(20);
    text("Press 'C' to Continue or 'R' to Restart", width/2, height/2 + 20);

    if (bgMusic && bgMusic.isPlaying()) {
      bgMusic.pause();
    }
  } else {
    drawingContext.filter = 'none';
  }

  textAlign(LEFT, BASELINE);
}

function drawBackgroundGrid() {
  background(0);
  let baseColor = isBullMarket ? color(0, 255, 0) : color(255, 0, 0);

  noFill();
  let halfHeight = height/2.0;
  let topY = 0;
  let bottomY = height;
  let halfLines = numHorizontalLines / 2;

  // 위쪽 수평선
  for (let i = 1; i <= halfLines; i++) {
    let t = i / (halfLines + 1);
    let lineY = lerp(vanishY, topY, t);
    let distFromVanish = abs(lineY - vanishY);
    let alphaVal = map(distFromVanish, 0, halfHeight, 0, 255);
    let lineCol = color(red(baseColor), green(baseColor), blue(baseColor), alphaVal);
    stroke(lineCol);

    let lineWidthFactor = distFromVanish / halfHeight;
    let halfWidth = (width/2) * lineWidthFactor;
    let startX = width/2 - halfWidth;
    let endX = width/2 + halfWidth;
    line(startX, lineY, endX, lineY);
  }

  // 아래쪽 수평선
  for (let i = 1; i <= halfLines; i++) {
    let t = i / (halfLines + 1);
    let lineY = lerp(vanishY, bottomY, t);
    let distFromVanish = abs(lineY - vanishY);
    let alphaVal = map(distFromVanish, 0, halfHeight, 0, 255);
    let lineCol = color(red(baseColor), green(baseColor), blue(baseColor), alphaVal);
    stroke(lineCol);

    let lineWidthFactor = distFromVanish / halfHeight;
    let halfWidth = (width/2) * lineWidthFactor;
    let startX = width/2 - halfWidth;
    let endX = width/2 + halfWidth;
    line(startX, lineY, endX, lineY);
  }

  // 세로선
  for (let j = 1; j <= numVerticalLines; j++) {
    let v = j / (numVerticalLines + 1);
    let vertAlpha = 128;
    let vertColor = color(red(baseColor), green(baseColor), blue(baseColor), vertAlpha);
    stroke(vertColor);

    let lineXLeft = lerp(width/2, 0, v);
    line(width/2, vanishY, lineXLeft, topY);
    line(width/2, vanishY, lineXLeft, bottomY);

    let lineXRight = lerp(width/2, width, v);
    line(width/2, vanishY, lineXRight, topY);
    line(width/2, vanishY, lineXRight, bottomY);
  }
}

function drawEnvironment(updateLogic) {
  let currentShrimpImage = (leftPressed) ? shrimpLeft : shrimpRight;
  let centerX = width/2;
  let centerY = height/2;

  // 고래 이동
  for (let whale of whales) {
    if (updateLogic && !isPaused) {
      let distance = dist(playerX, playerY, whale[0], whale[1]);
      let oldX = whale[0];
      let oldY = whale[1];

      if (!inExchangeZone && distance <= maxDistance) {
        whale[0] += (playerX > whale[0]) ? whaleSpeed : -whaleSpeed;
        whale[1] += (playerY > whale[1]) ? whaleSpeed : -whaleSpeed;
      } else {
        let angleToCenter = atan2(centerY - whale[1], centerX - whale[0]);
        let moveSpeed = 0.3;
        whale[0] += cos(angleToCenter)*moveSpeed + random(-0.3,0.3);
        whale[1] += sin(angleToCenter)*moveSpeed + random(-0.3,0.3);

        whale[0] = constrain(whale[0], width/4, (3*width)/4);
        whale[1] = constrain(whale[1], height/4, (3*height)/4);
      }

      if (collidesWithExchangeZone(whale[0], whale[1])) {
        whale[0] = oldX;
        whale[1] = oldY;
      }
    }
    let currentWhaleImage = (playerX > whale[0]) ? whaleRightImg : whaleLeftImg;
    image(currentWhaleImage, whale[0], whale[1]);
  }

  imageMode(CENTER);
  image(currentShrimpImage, playerX, playerY);

  fill(0, 255, 0);
  rectMode(CORNER);
  rect(exchangeX, exchangeY, exchangeSize, exchangeSize);

  imageMode(CORNER);
  for (let c of coins) {
    image(coinGif, c[0]-15, c[1]-15, 30, 30);
  }

  fill(200, 100, 100);
  for (let coral of corals) {
    rect(coral[0], coral[1], 30, 30);
  }

  fill(100, 100, 100);
  for (let rock of rocks) {
    rect(rock[0], rock[1], 50, 50);
  }

  if (updateLogic && !isPaused) {
    let nextX = playerX;
    let nextY = playerY;
    if (upPressed) nextY -= 5;
    if (downPressed) nextY += 5;
    if (leftPressed) nextX -= 5;
    if (rightPressed) nextX += 5;

    if (!collidesWithRock(nextX, nextY)) {
      playerX = nextX;
      playerY = nextY;
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      let c = coins[i];
      if (dist(playerX, playerY, c[0], c[1]) < 15) {
        coins.splice(i,1);
        heldCoins++;
        if (heldCoins == 1) {
          averageBuyPrice = coinPrice;
        } else {
          averageBuyPrice = ((averageBuyPrice * (heldCoins - 1)) + coinPrice) / heldCoins;
        }

        whaleSpeed += speedIncrement;
        if (heldCoins % 10 == 0) spawnWhale();
        if (coinSound) {
          coinSound.stop();
          coinSound.play();
        }

        messages.push(new FloatingMessage("+" + coinPrice.toFixed(2), playerX, playerY - 20, 60));
      }
    }

    if (coins.length < coinCount) spawnCoins(coinCount - coins.length);

    if (playerX > exchangeX && playerX < exchangeX + exchangeSize &&
        playerY > exchangeY && playerY < exchangeY + exchangeSize) {
      inExchangeZone = true;
    } else {
      inExchangeZone = false;
    }

    for (let whale of whales) {
      if (dist(playerX, playerY, whale[0], whale[1]) < 20 && !inExchangeZone) {
        gameOverFunc();
      }
    }
  }

  textFont(myFont);
  textSize(24);
  textAlign(LEFT, BASELINE);

  let infoX = 30;
  let infoY = 50;
  let lineSpacing = 35; 
  let portfolio = heldCoins * coinPrice; 

  if (heldCoins > 0 && coinPrice < averageBuyPrice) {
    fill(255,0,0);
  } else {
    fill(255);
  }
  text("Portfolio: " + portfolio.toFixed(2), infoX, infoY);

  fill(255);
  text("Realized Gains: " + realizedGains.toFixed(2), infoX, infoY + lineSpacing);
  text("Coin Price: " + coinPrice.toFixed(2), infoX, infoY + lineSpacing*2);

  if (inExchangeZone) {
    fill(255, 255, 0);
    textSize(18);
    textAlign(LEFT, BASELINE);
    text("Press 'S' to Sell Coins", exchangeX, exchangeY - 10);
  }

  // Current Market 표시 (우측 상단)
  textSize(24);
  textAlign(RIGHT, TOP);
  fill(255);
  let marketStatus = isBullMarket ? "Bull" : "Bear";
  text("Current Market: " + marketStatus, width - 30, 30);

  // 떠다니는 메시지
  for (let i = messages.length - 1; i >= 0; i--) {
    let m = messages[i];
    fill(255, 255, 0);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(m.text, m.x, m.y);
    if (!isPaused && updateLogic) {
      m.y -= 0.5;
    }
    m.frames--;
    if (m.frames <= 0) {
      messages.splice(i, 1);
    }
  }

  textAlign(LEFT, BASELINE);
}

function keyPressed() {
  if (!isGameOver) {
    if (key == 'q' || key == 'Q') {
      isPaused = !isPaused;
      return; 
    }
    if (isPaused) {
      if (key == 'c' || key == 'C') {
        isPaused = false;
      } else if (key == 'r' || key == 'R') {
        resetGame();
        isPaused = false;
      }
      return;
    }
  }

  if (key == 'r' && isGameOver) {
    resetGame();
  }

  if (key == 's' && inExchangeZone && heldCoins > 0) {
    realizedGains += heldCoins * coinPrice;
    heldCoins = 0;
    averageBuyPrice = 0;
  }

  if (keyCode === UP_ARROW) upPressed = true;
  if (keyCode === DOWN_ARROW) downPressed = true;
  if (keyCode === LEFT_ARROW) leftPressed = true;
  if (keyCode === RIGHT_ARROW) rightPressed = true;
}

function keyReleased() {
  if (keyCode === UP_ARROW) upPressed = false;
  if (keyCode === DOWN_ARROW) downPressed = false;
  if (keyCode === LEFT_ARROW) leftPressed = false;
  if (keyCode === RIGHT_ARROW) rightPressed = false;
}

function resetGame() {
  playerX = width / 2;
  playerY = height / 2;
  whales = [];
  coins = [];
  corals = [];
  rocks = [];
  spawnWhale();
  spawnWhale();
  spawnCoins(coinCount);
  spawnCorals(coralCount);
  spawnRocks(rockCount);
  exchangeX = int(random(100, width - 100));
  exchangeY = int(random(100, height - 100));
  inExchangeZone = false;
  isGameOver = false;
  heldCoins = 0;
  realizedGains = 0;
  averageBuyPrice = 0;
  whaleSpeed = 1.0;
  coinPrice = 1.0;
  isBullMarket = true;
  marketToggleTimer = frameCount;
  exchangeMoveTimer = frameCount;

  messages = [];

  if (bgMusic && bgMusic.isPlaying()) {
    bgMusic.stop();
  }
  currentTrack = int(random(tracks.length));
  bgMusic = trackSounds[currentTrack];
  bgMusic.play();
}

function spawnWhale() {
  let x = int(random(width / 4, 3 * width / 4));
  let y = int(random(height / 4, 3 * height / 4));
  whales.push([x,y]);
}

function spawnCoins(num) {
  for (let i = 0; i < num; i++) {
    let x = int(random(20, width - 20));
    let y = int(random(20, height - 20));
    coins.push([x,y]);
  }
}

function spawnCorals(num) {
  for (let i = 0; i < num; i++) {
    let x = int(random(50, width - 50));
    let y = int(random(50, height - 50));
    corals.push([x,y]);
  }
}

function spawnRocks(num) {
  for (let i = 0; i < num; i++) {
    let x = int(random(50, width - 50));
    let y = int(random(50, height - 50));
    rocks.push([x,y]);
  }
}

function collidesWithRock(x, y) {
  for (let rock of rocks) {
    if (x > rock[0] && x < rock[0] + 50 && y > rock[1] && y < rock[1] + 50) {
      return true;
    }
  }
  return false;
}

function collidesWithExchangeZone(x, y) {
  return (x > exchangeX && x < exchangeX + exchangeSize &&
          y > exchangeY && y < exchangeY + exchangeSize);
}

function gameOverFunc() {
  isGameOver = true;
  if (bgMusic && bgMusic.isPlaying()) {
    bgMusic.pause();
  }
  gameOverSound.stop();
  gameOverSound.play();
}

function changeTrack(newTrackIndex) {
  if (newTrackIndex < 0 || newTrackIndex >= tracks.length) {
    return; 
  }
  if (bgMusic && bgMusic.isPlaying()) {
    bgMusic.stop();
  }
  currentTrack = newTrackIndex;
  bgMusic = trackSounds[currentTrack];
  bgMusic.play();
}

function moveExchange() {
  exchangeX = int(random(100, width - 100));
  exchangeY = int(random(100, height - 100));
}
