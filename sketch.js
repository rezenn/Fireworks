const SHELLTYPES = [
  "simple",
  "split",
  "burst",
  "double",
  "mega",
  "writer",
  "pent",
  "comet",
  "heart",
  "spiral",
  "sunflower",
];
const GRAVITY = 0.2;
var PAUSED = true;
var MUTE = false;

var shells = [];
var stars = [];
var sounds = [];

const IS_MOBILE = /Android|iPhone|iPad/i.test(navigator.userAgent);
const DENSITY = IS_MOBILE ? 0.5 : 1;

let numStars = Math.floor(80 * DENSITY);
let seeds = Math.floor(160 * DENSITY);
let rows = IS_MOBILE ? 5 : 8;

let sky;

function makeSky() {
  sky = createGraphics(windowWidth, windowHeight);
  sky.pixelDensity(1);
  let ctx = sky.drawingContext;

  let g = ctx.createLinearGradient(0, 0, 0, windowHeight);
  g.addColorStop(0, "#02030a");
  g.addColorStop(0.6, "#0a1128");
  g.addColorStop(1, "#1b2440");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, windowWidth, windowHeight);

  sky.noStroke();
  for (let i = 0; i < 250; i++) {
    sky.fill(255, 255, 255, random(80, 255));
    sky.circle(random(windowWidth), random(windowHeight * 0.8), random(0.5, 2));
  }

  let mx = windowWidth * 0.8;
  let my = windowHeight * 0.18;
  let r = min(windowWidth, windowHeight) * 0.06;
  ctx.save();
  ctx.shadowColor = "rgba(255, 250, 220, 0.8)";
  ctx.shadowBlur = r * 1.5;
  sky.fill(245, 243, 225);
  sky.circle(mx, my, r * 2);
  ctx.restore();

  sky.fill(215, 212, 195, 150);
  sky.circle(mx - r * 0.3, my - r * 0.25, r * 0.4);
  sky.circle(mx + r * 0.25, my + r * 0.1, r * 0.3);
  sky.circle(mx - r * 0.1, my + r * 0.4, r * 0.2);

  ctx.filter = "blur(6px)";
  drawCloud(sky, windowWidth * 0.25, windowHeight * 0.25, windowWidth * 0.3);
  drawCloud(sky, windowWidth * 0.65, windowHeight * 0.4, windowWidth * 0.35);
  drawCloud(sky, windowWidth * 0.1, windowHeight * 0.55, windowWidth * 0.25);
  ctx.filter = "none";
}

function drawCloud(g, x, y, w) {
  g.noStroke();
  for (let i = 0; i < 25; i++) {
    g.fill(50, 60, 90, 18);
    g.ellipse(
      x + random(-w / 2, w / 2),
      y + random(-w * 0.06, w * 0.06),
      random(w * 0.2, w * 0.5),
      random(w * 0.08, w * 0.2),
    );
  }
}

function setup() {
  pixelDensity(1);

  createCanvas(windowWidth, windowHeight);
  makeSky();
  image(sky, 0, 0);
  strokeWeight(1);
  frameRate(30);
  colorMode(HSB);
  for (let i = 0; i < 3; i++) {
    sounds.push(loadSound("sounds/explosion" + i + ".mp3"));
  }
}

function draw() {
  translate(width / 2, height);

  drawingContext.globalAlpha = 0.2;
  image(sky, -width / 2, -height);
  drawingContext.globalAlpha = 1;
  shells = shells.filter((shell) => !shell.exploded);
  stars = stars.filter((star) => star.brt > 0);

  for (let shell of shells) shell.draw();
  for (let star of stars) star.draw();

  if (random() < 0.03) {
    let s = new Shell();
    shells.push(s);
  }
  const MAX_STARS = 1500;
  if (stars.length > MAX_STARS) stars.splice(0, stars.length - MAX_STARS);

  resetMatrix();
  noStroke();
  fill(0, 0, 100);
  textSize(14);
  textAlign(CENTER);
}

class Shell {
  constructor(position, speed, type, sparkleTrail) {
    if (position == undefined)
      position = createVector(int(random(-width / 4, width / 4)), 0);
    if (speed == undefined)
      speed = createVector(random(-2, 2), -random(11, 16));
    if (sparkleTrail == undefined) sparkleTrail = random() < 0.5;
    if (type == undefined) {
      let randIndex = floor(random(0, SHELLTYPES.length));
      type = SHELLTYPES[randIndex];
    }
    if (random() < (IS_MOBILE ? 0.015 : 0.03)) {
    }
    this.position = position;
    this.speed = speed;
    this.sparkleTrail = sparkleTrail;
    this.fuse = random(-3, -1);
    this.hue = round(random(0, 360));
    this.type = type;
    this.exploded = false;
  }

  draw() {
    if (this.fuse < this.speed.y) {
      this.explode();
      return;
    }

    if (this.sparkleTrail) {
      let sparkleDir = random(0, TWO_PI);
      let sparkleVel = random(0, 1);
      let sparkleSpd = createVector(
        sparkleVel * cos(sparkleDir),
        sparkleVel * sin(sparkleDir),
      );
      let sparklePos = createVector(
        this.position.x + sparkleSpd.x,
        this.position.y + sparkleSpd.y,
      );
      let s = new Star(
        sparklePos,
        sparkleSpd,
        random(50, 75),
        floor(random(20, 40)),
        floor(random(0, 30)),
      );
      stars.push(s);
    }

    stroke(this.hue + round(random(-10, 10)), random(0, 20), 90);
    point(this.position.x, this.position.y);

    this.position.add(this.speed);
    this.speed.y = this.speed.y + GRAVITY;
  }

  drawStars(numStars, velMin, velMax, fadeMin, fadeMax, type, baseDir, angle) {
    for (let i = 0; i < numStars; i++) {
      let dir = random(0, TWO_PI);
      if (baseDir != undefined) dir = baseDir + random(0, PI / angle);
      let vel = random(velMin, velMax);
      let starSpd = createVector(
        this.speed.x + vel * cos(dir),
        this.speed.y + vel * sin(dir),
      );
      let hue = this.hue + round(random(-10, 10));
      let sat = round(random(0, 40));
      let fade = random(fadeMin, fadeMax);
      let star = new Star(this.position.copy(), starSpd, fade, hue, sat, type);
      stars.push(star);
    }
  }
  drawHearts() {
    let numStars = 80;
    let scale = 0.25;
    let hue = round(random(300, 390));

    for (let i = 0; i < numStars; i++) {
      let t = (TWO_PI * i) / numStars;
      let hx = 16 * pow(sin(t), 3);
      let hy = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));

      let starSpd = createVector(
        this.speed.x + hx * scale,
        this.speed.y + hy * scale,
      );

      let star = new Star(
        this.position.copy(),
        starSpd,
        4,
        hue,
        round(random(60, 100)),
        "writer",
      );
      stars.push(star);
    }
  }
  drawSunflower() {
    let rot = random(TWO_PI);
    let centerR = 1.5;

    this.petalRing(14, 1.3, 5.1, 0.7, rot, 60, 20);
    this.petalRing(14, 1.3, 4.0, 0.6, rot + PI / 12, 50, 56);

    let seeds = 160;
    for (let n = 0; n < seeds; n++) {
      let r = centerR * sqrt(n / seeds);
      let a = n * 2.39996 + rot;
      let t = r / centerR;

      let hue = lerp(16, 25, t);
      let sat = lerp(95, 70, t);
      let dim = lerp(0.1, 0.3, t);

      let spd = createVector(
        this.speed.x + r * cos(a),
        this.speed.y + r * sin(a),
      );
      stars.push(
        new Star(this.position.copy(), spd, 3, hue, sat, "default", dim, 2),
      );
    }
  }

  petalRing(count, inner, outer, halfW, rot, hueBase, hueTip) {
    let rows = 8;
    for (let k = 0; k < count; k++) {
      let a = rot + (TWO_PI * k) / count;
      let ux = cos(a),
        uy = sin(a);
      let px = -uy,
        py = ux;

      for (let j = 0; j < rows; j++) {
        let s = j / (rows - 1);
        let r = lerp(inner, outer, s);
        let w = halfW * sin(PI * pow(s, 0.7));

        for (let side of [-1, 0, 1]) {
          let lateral = side * w;
          let spd = createVector(
            this.speed.x + r * ux + lateral * px,
            this.speed.y + r * uy + lateral * py,
          );
          let hue = lerp(hueBase, hueTip, s) + random(-2, 2);
          let sat = lerp(100, 80, s);
          stars.push(
            new Star(this.position.copy(), spd, 3, hue, sat, "default", 1, 1.5),
          );
        }
      }
    }
  }
  explode() {
    if (this.type == "split") {
      this.drawStars(30, 3, 5, 3, 8, "writer");
      this.drawStars(10, 3, 5, 3, 6, "sparkler");
    } else if (this.type == "burst") {
      this.drawStars(60, 0, 6, 3, 8, "sparkler");
    } else if (this.type == "double") {
      this.drawStars(90, 3, 5, 2, 4);
      this.drawStars(90, 0.5, 2, 4, 6, "writer");
    } else if (this.type == "mega") {
      this.drawStars(600, 0, 8, 3, 8);
    } else if (this.type == "writer") {
      this.drawStars(100, 0, 5, 1, 3, "writer");
    } else if (this.type == "simple") {
      this.drawStars(100, 0, 5, 1, 3);
    } else if (this.type == "sunflower") {
      this.drawSunflower();
    } else if (this.type == "heart") {
      this.drawHearts();
    } else if (this.type == "sunflower") {
      this.drawSunflower();
    } else if (this.type == "pent") {
      let baseDir = random(0, TWO_PI);
      this.drawStars(20, 3, 5, 3, 8, "writer", baseDir + (2 / 5) * PI, 6);
      this.drawStars(20, 3, 5, 3, 8, "writer", baseDir + (4 / 5) * PI, 6);
      this.drawStars(20, 3, 5, 3, 8, "writer", baseDir + (6 / 5) * PI, 6);
      this.drawStars(20, 3, 5, 3, 8, "writer", baseDir + (8 / 5) * PI, 6);
      this.drawStars(20, 3, 5, 3, 8, "writer", baseDir + (10 / 5) * PI, 6);
    } else if (this.type == "comet") {
      let baseDir = random(0, TWO_PI);
      this.drawStars(10, 3, 7, 3, 8, "sparkler", baseDir + (2 / 3) * PI, 128);
      this.drawStars(10, 3, 7, 3, 8, "sparkler", baseDir + (4 / 3) * PI, 128);
      this.drawStars(10, 3, 7, 3, 8, "sparkler", baseDir + (6 / 3) * PI, 128);
      this.drawStars(200, 0, 8, 3, 8, "writer");
    }
    this.exploded = true;
    if (!MUTE) {
      let randIndex = floor(random(0, sounds.length));
      sounds[randIndex].play();
    }
  }
}

class Star {
  constructor(position, speed, fade, hue, sat, type, dim, size) {
    this.position = position;
    this.speed = speed;
    this.fade = fade;
    this.hue = hue;
    this.sat = sat;
    this.dim = dim == undefined ? 1 : dim;
    this.size = size == undefined ? 1 : size;
    this.type = type == undefined ? "default" : type;
    this.brt = 255;
    this.burntime = 0;
  }

  draw() {
    strokeWeight(this.size);
    stroke(this.hue, this.sat, this.brt * this.dim);
    let newXPos = this.position.x + log(this.burntime) * 8 * this.speed.x;
    let newYPos =
      this.position.y +
      log(this.burntime) * 8 * this.speed.y +
      this.burntime * GRAVITY;

    point(newXPos, newYPos);

    if (this.type == "writer" && this.burntime > 1) {
      line(
        newXPos,
        newYPos,
        this.position.x + log(this.burntime - 2) * 8 * this.speed.x,
        this.position.y +
          log(this.burntime - 2) * 8 * this.speed.y +
          this.burntime * GRAVITY,
      );
    }

    if (this.type == "sparkler") {
      let dir = random(0, TWO_PI);
      let vel = random(0, 1);
      let starSpd = createVector(vel * cos(dir), vel * sin(dir));
      let star = new Star(
        createVector(newXPos + starSpd.x, newYPos + starSpd.y),
        starSpd,
        random(50, 75),
        round(random(20, 40)),
        round(random(0, 30)),
        1,
        1,
      );
      stars.push(star);
    }

    this.brt -= this.fade;
    this.burntime++;
    strokeWeight(1);
    if (getAudioContext().state !== "running") {
      noStroke();
      fill(0, 0, 100);
      textAlign(CENTER);
      textSize(18);
      text("Click anywhere to enable sound", 0, -height / 2);
    }
  }
}

function touchMoved() {
  touchStarted();
  return false;
}

function touchStarted() {
  userStartAudio();
  let type = random(["sunflower", "heart"]);
  let speed = createVector(0, 0);
  let position = createVector(mouseX - width / 2, mouseY - height);
  let s = new Shell(position, speed, type);
  s.explode();
  return false;
}

function keyPressed() {
  userStartAudio();
  if (keyCode == 32) {
    if (PAUSED) {
      PAUSED = false;
      strokeWeight(1);
      fill(255);
      rect(width / 2 - 30, -height + 20, 10, 30);
      rect(width / 2 - 50, -height + 20, 10, 30);
      noLoop();
    } else {
      PAUSED = true;
      loop();
    }
    return false;
  }
  if (keyCode == 83) {
    MUTE = !MUTE;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  makeSky();
}
