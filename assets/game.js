let SPEED_PER_MINUTE = 4.6;
let FINISH_SCORE = 50;

let giftSpawnTimeMin = 0.75;
let giftSpawnTimeMax = 2;

let bubbleSpawnTimeMin = 3;
let bubbleSpawnTimeMax = 6;

let giftSize = 84;
let bubbleSize = 54;
let playerSize = 180;

let lastTime = 0;
let time = 0;

let lives = 3;
let livesMax = 3;
let speed = 1;
let speedMax = 5;
let speedMult = 100;
let score = 1;
let progress = 0;

let nextGiftSpawnTime = 0;
let nextBubbleSpawnTime = 0;

let gameActive = false;
let gameWidth = 480;
let gameHeight = 480;
let gameScale = 1;

let bgImageWidth = 1080;
let bgImageHeight = 1920;

let canvas = null;
let ctx = null;

function updateGameSize() {
    gameScale = canvas.width / gameWidth;
    const r = canvas.height / canvas.width;
    gameHeight = Math.ceil(gameWidth * r);
    player.y = gameHeight - player.h;

    if (canvas.width < canvas.height * 0.5625) {
        bgImageWidth = canvas.height * 0.5625;
        bgImageHeight = canvas.height;
    } else {
        bgImageWidth = canvas.width;
        bgImageHeight = canvas.width / 0.5625;
    }
}

let assets = [
    'mini-game/assets/images/bg.png',
    'mini-game/assets/images/player.png',
    'mini-game/assets/images/gift_1.png',
    'mini-game/assets/images/gift_2.png',
    'mini-game/assets/images/gift_3.png',
    'mini-game/assets/images/gift_4.png',
    'mini-game/assets/images/gift_5.png',
    'mini-game/assets/images/gift_icon.png',
    'mini-game/assets/images/progress_bar_bg.png',
    'mini-game/assets/images/progress_bar.png',
    'mini-game/assets/images/heart_bg.png',
    'mini-game/assets/images/heart.png',
    'mini-game/assets/images/bubble.png'
];

let images = {};

let gifts = [];
let bubbles = [];
let giftsToRemove = [];
let bubblesToRemove = [];

let player = {
    x: gameWidth / 2,
    y: 0,
    w: playerSize, // 72
    h: playerSize // 72
};

function randomFloat(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return Math.floor(randomFloat(min, max));
}

async function loadResources(imageUrlArray) {
    const promiseArray = [];
    const imageArray = [];

    for (let imageUrl of imageUrlArray) {
        promiseArray.push(new Promise(resolve => {
            const img = new Image();

            img.onload = function () {
                images[imageUrl] = img;
                resolve();
            };

            img.src = imageUrl;
            imageArray.push(img);
        }));
    }

    await Promise.all(promiseArray);
    return imageArray;
}

function onMouseMove(x, y) {
    player.x = x / gameScale;
}

const callback = function (millis) {
    if (lastTime != 0) {
        gameUpdate((millis - lastTime) / 1000);
        gameDraw();
    }
    lastTime = millis;
    window.requestAnimationFrame(callback);
};

function initGame() {
    canvas = document.getElementById("catchGame");
    ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    updateGameSize();

    window.onresize = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        updateGameSize();
    };

    canvas.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        onMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener("touchmove", function (e) {
        var rect = canvas.getBoundingClientRect();
        onMouseMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    });

    // gameStart(); // for quick test
}

function createGift() {
    const w = giftSize;
    const h = giftSize;
    const x = randomInt(w, gameWidth - w);
    const v = 1;
    const av = randomFloat(-100, 100);

    const e = {
        image: images['mini-game/assets/images/gift_' + randomInt(1, 6) + '.png'],
        x: x,
        y: -h,
        r: 0,
        w: w,
        h: h,
        v: v,
        av: av,
    };
    gifts.push(e);
}

function createBubble() {
    const w = bubbleSize;
    const h = bubbleSize;
    const x = randomInt(w, gameWidth - w);
    const v = 0.65;

    const e = {
        image: images['mini-game/assets/images/bubble.png'],
        x: x,
        startX: x,
        y: -h,
        r: 0,
        w: w,
        h: h,
        v: v,
        t: time,
    };
    bubbles.push(e);
}

function gameUpdate(dt) {
    if (!gameActive) return;

    time += dt;
    // speed += SPEED_PER_MINUTE/(60*60);
    speed += (SPEED_PER_MINUTE / 60) * dt;
    // console.log(speed);

    if (speed > speedMax) speed = speedMax;

    if (time >= nextGiftSpawnTime) {
        nextGiftSpawnTime = time + (randomFloat(giftSpawnTimeMin, giftSpawnTimeMax) / speed);
        createGift();
    }

    if (time >= nextBubbleSpawnTime) {
        nextBubbleSpawnTime = time + (randomFloat(bubbleSpawnTimeMin, bubbleSpawnTimeMax) / speed);
        createBubble();
    }

    updateGifts(dt);
    updateBubbles(dt);
}

function gameDraw() {
    if (!gameActive) return;

    // ctx.drawImage(images['assets/images/bg.png'], 0, 0, canvas.width, canvas.height);
    // ctx.drawImage(images['assets/images/bg.png'], 0, 0, canvas.width, gameHeight*gameScale);
    ctx.drawImage(images['mini-game/assets/images/bg.png'], 0, 0, bgImageWidth, bgImageHeight);
    // ctx.drawImage(images['assets/images/bg2.png'], 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(gameScale, gameScale);

    drawElements(gifts);
    drawElements(bubbles);
    drawPlayer();
    drawLives();
    drawProgress();

    ctx.restore();
}

function updateGifts(dt) {
    for (let i = 0; i < gifts.length; i++) {
        const e = gifts[i];
        e.y += e.v * speed * speedMult * dt;
        e.r += e.av * dt;

        if (playerCollideWithElement(e)) {
            // score++;
            giftsToRemove.push(e);
            addScore(1);
        }

        if (e.y - e.h > gameHeight) {
            giftsToRemove.push(e);
            removeLife(1);
        }
    }

    if (giftsToRemove.length > 0) {
        let rem = giftsToRemove.pop();
        while (rem !== undefined) {
            const idx = gifts.indexOf(rem);
            if (idx >= 0) gifts.splice(idx, 1);
            // console.log('remove gift: ' + rem);
            rem = giftsToRemove.pop();
        }
    }
}

function updateBubbles(dt) {
    for (let i = 0; i < bubbles.length; i++) {
        const e = bubbles[i];
        e.y += e.v * speed * speedMult * dt;
        e.x = e.startX + 56 * Math.sin(e.t + time * 2);

        if (playerCollideWithElement(e)) {
            bubblesToRemove.push(e);
            // removeScore(3);
            removeLife(1);
        }

        if (e.y - e.h > gameHeight) {
            bubblesToRemove.push(e);
        }
    }

    if (bubblesToRemove.length > 0) {
        let rem = bubblesToRemove.pop();
        while (rem !== undefined) {
            const idx = bubbles.indexOf(rem);
            if (idx >= 0) bubbles.splice(idx, 1);
            // console.log('remove gift: ' + rem);
            rem = bubblesToRemove.pop();
        }
    }
}

function drawElements(elements) {
    for (let i = 0; i < elements.length; i++) {
        const e = elements[i];

        ctx.translate(e.x, e.y);
        ctx.rotate(e.r * 0.0174532925199432781);
        ctx.drawImage(e.image, -(e.w / 2), -(e.h / 2), e.w, e.h);
        ctx.rotate(-(e.r * 0.0174532925199432781));
        ctx.translate(-e.x, -e.y);
    }
}

function drawPlayer() {
    ctx.drawImage(images['mini-game/assets/images/player.png'], player.x - player.w / 2, player.y, player.w, player.h);
    // ctx.fillRect(player.x, player.h, player.w, player.h);
}

function drawLives() {
    let ox = 16;
    let oy = 16;
    const imgSize = 48;
    const mrg = -20;
    const heart = images['mini-game/assets/images/heart.png'];
    const heartBg = images['mini-game/assets/images/heart_bg.png'];
    let img = heart;

    for (let i = 0; i < livesMax; i++) {
        if (i + 1 > lives) {
            img = heartBg;
        } else {
            img = heart;
        }
        ctx.drawImage(img, ox + i * (imgSize + mrg), oy, imgSize, imgSize);
    }
}

function drawProgress() {
    const prBg = images['mini-game/assets/images/progress_bar_bg.png'];
    const pr = images['mini-game/assets/images/progress_bar.png'];
    const oy = 28;
    const pbgW = gameWidth / 2;
    const ph = 24;
    const pw = pbgW * progress;
    const sPos = gameWidth / 2 - pbgW / 2 + 16;
    const capSize = ph / 8;

    ctx.drawImage(prBg, 17, 0, 30, 128, capSize + sPos, oy, pbgW, ph);
    ctx.drawImage(prBg, 0, 0, 16, 128, sPos, oy, capSize, ph);
    ctx.drawImage(prBg, 48, 0, 16, 128, sPos + pbgW + capSize, oy, capSize, ph);

    ctx.drawImage(pr, capSize + sPos, oy + capSize, pw, ph - capSize * 2);

    ctx.drawImage(images['mini-game/assets/images/gift_icon.png'], gameWidth - 80, 16, 48, 48);
}

function removeLife(amount) {
    lives -= amount;
    if (lives <= 0) gameOver();
}

function addScore(amount) {
    score += amount;
    if (score > FINISH_SCORE) score = FINISH_SCORE;
    progress = score / FINISH_SCORE;
    if (score === FINISH_SCORE) gameWin();
}

function removeScore(amount) {
    score -= amount;
    if (score < 0) score = 0;
}

function playerCollideWithElement(e) {
    // return e.y < (player.y+player.h/3) && collide(e.x, e.y, e.w/2, player.x, player.y+player.h, player.w/2, player.h/2);
    return e.y < (player.y + player.h / 3) && collide(e.x, e.y, e.w / 2, player.x, player.y + player.h * 0.9, player.w * 0.3, player.h / 2);
    // return collide(e.x, e.y, e.w/2, player.x, player.y+player.h, player.w/2, player.h/2);
}

function collide(cx, cy, cr, bx, by, bhw, bhh) {
    var cx_ = cx;
    var cy_ = cy;

    var minx = bx - bhw;
    var miny = by - bhh;
    var maxx = bx + bhw;
    var maxy = by + bhh;

    if (cx < minx) cx = minx;
    if (cx > maxx) cx = maxx;
    if (cy < miny) cy = miny;
    if (cy > maxy) cy = maxy;

    var dx = cx_ - cx;
    var dy = cy_ - cy;

    return (dx * dx + dy * dy < cr * cr);
}

function setConfigs(conf) {
    if (!conf) return;

    if (conf.SPEED_PER_MINUTE)
        SPEED_PER_MINUTE = conf.SPEED_PER_MINUTE;

    if (conf.SPEED_PER_MINUTE)
        FINISH_SCORE = conf.FINISH_SCORE;

    if (conf.giftSpawnTimeMin)
        giftSpawnTimeMin = conf.giftSpawnTimeMin;

    if (conf.giftSpawnTimeMax)
        giftSpawnTimeMax = conf.giftSpawnTimeMax;

    if (conf.bubbleSpawnTimeMin)
        bubbleSpawnTimeMin = conf.bubbleSpawnTimeMin;

    if (conf.bubbleSpawnTimeMax)
        bubbleSpawnTimeMax = conf.bubbleSpawnTimeMax;

    if (conf.giftSize)
        giftSize = conf.giftSize;

    if (conf.bubbleSize)
        bubbleSize = conf.bubbleSize;

    if (conf.playerSize)
        playerSize = conf.playerSize;
}

function gameStart() {
    loadResources(assets).then(() => {
        initGame();

        progress = score / FINISH_SCORE;

        gameActive = true;

        gifts = [];
        bubbles = [];
        giftsToRemove = [];
        bubblesToRemove = [];

        score = 0;
        progress = 0;
        speed = 1;
        lives = 3;
        lastTime = 0;
        time = 0;
        nextGiftSpawnTime = 0;
        nextBubbleSpawnTime = randomFloat(bubbleSpawnTimeMin, bubbleSpawnTimeMax);

        callback(0);
    });
}

function gameOver() {
    const event = new Event('gameOver');

    document.dispatchEvent(event);

    // this.toggleScreen('start-screen',false);
    // // this.toggleScreen('catchGame',false);
    // this.toggleScreen('gamewin-screen',false);
    // this.toggleScreen('gameover-screen',true);

    gameActive = false;
}

function gameWin() {
    const event = new Event('gameWin');

    document.dispatchEvent(event);

    // this.toggleScreen('start-screen',false);
    // // this.toggleScreen('catchGame',false);
    // this.toggleScreen('gamewin-screen',true);
    // this.toggleScreen('gameover-screen',false);

    gameActive = false;
}

