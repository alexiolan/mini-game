import {Component, inject, OnInit} from '@angular/core';
import {AuthService, ConfigService, GameService} from "./core";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    protected readonly configService = inject(ConfigService);

    private SPEED_PER_MINUTE = 0;
    private FINISH_SCORE = 0;
    private giftSpawnTimeMin = 0;
    private giftSpawnTimeMax = 0;
    private bubbleSpawnTimeMin = 0;
    private bubbleSpawnTimeMax = 0;

    private lastTime = 0;
    private time = 0;

    private lives = 3;
    private livesMax = 3;
    private speed = 1;
    private speedMax = 5;
    private speedMult = 100;
    private score = 1;
    private progress = 0;


    private nextGiftSpawnTime = 0;
    private nextBubbleSpawnTime = 0;

    private gameActive = false;
    private gameFinished = false;
    public gameWidth = 0;
    public gameHeight = 0;
    private gameScale = 1;

    private assets = [
        'assets/images/bg.png',
        'assets/images/player.png',
        'assets/images/gift_1.png',
        'assets/images/gift_2.png',
        'assets/images/gift_3.png',
        'assets/images/gift_4.png',
        'assets/images/gift_5.png',
        'assets/images/gift_icon.png',
        'assets/images/progress_bar_bg.png',
        'assets/images/progress_bar.png',
        'assets/images/heart_bg.png',
        'assets/images/heart.png',
        'assets/images/bubble.png'
    ];

    private images: { [key: string]: any } = {};

    private gifts: any[] = [];
    private bubbles: any[] = [];
    private giftsToRemove: any[] = [];
    private bubblesToRemove: any[] = [];

    private player = {
        x: this.gameWidth / 2,
        y: 0,
        w: 72,
        h: 72
    };

    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;

    public userEmail: string = "";
    public rewardTitle: string = "";

    constructor(private gameService: GameService, private authService: AuthService) {
        this.authService.setAccessToken(this.configService.config.api.token);
    }

    ngOnInit(): void {
        const gameContainer = document.getElementById("canvasContainer");

        if (!gameContainer) return;
        this.gameWidth = +gameContainer.offsetWidth;
        this.gameHeight = +gameContainer.offsetHeight;

        this.player = {
            x: this.gameWidth / 2,
            y: 0,
            w: 72,
            h: 72
        };

        this.gameService.getSettings().then(settings => {
            this.SPEED_PER_MINUTE = settings.SPEED_PER_MINUTE;
            this.FINISH_SCORE = settings.FINISH_SCORE;
            this.giftSpawnTimeMin = settings.giftSpawnTimeMin;
            this.giftSpawnTimeMax = settings.giftSpawnTimeMax;
            this.bubbleSpawnTimeMin = settings.bubbleSpawnTimeMin;
            this.bubbleSpawnTimeMax = settings.bubbleSpawnTimeMax;

            this.progress = this.score / this.FINISH_SCORE;
        });

        this.loadResources(this.assets);

        const canvas = document.getElementById("catchGame");
        if (canvas != null)
            this.canvas = canvas as HTMLCanvasElement;

        const ctx = document.getElementById("catchGame");
        if (ctx != null)
            this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;

        window.onload = window.onresize = () => {
            // this.gameWidth = +gameContainer.offsetWidth;
            // this.gameHeight = +gameContainer.offsetHeight;
            //this.updateGameSize();
        }
    }

    public claimGift() {
        if (!this.gameFinished) return;

        this.gameService.claim(this.userEmail).then(res => {
            this.rewardTitle = res.title;

            this.toggleScreen('gamewin-screen', false);
            this.toggleScreen('reward-screen', true);
        })
    }

    public gameStart() {
        this.toggleScreen('start-screen', false);
        this.toggleScreen('catchGame', true);
        this.toggleScreen('gameover-screen', false);

        this.gameActive = true;
        this.gameFinished = false;

        this.gifts = [];
        this.bubbles = [];
        this.giftsToRemove = [];
        this.bubblesToRemove = [];

        this.progress = 0;
        this.speed = 1;
        this.lives = 3;
        this.lastTime = 0;
        this.time = 0;
        this.nextGiftSpawnTime = 0;
        this.nextBubbleSpawnTime = this.randomFloat(this.bubbleSpawnTimeMin, this.bubbleSpawnTimeMax);

        this.callbackOnStart(0);
    }

    private initGame() {
        this.updateGameSize();

        const canvasLocal = this.canvas;
        const onMouseMove = (x: any, y: any) => {
            this.player.x = x / this.gameScale;
        }

        canvasLocal.addEventListener("mousemove", function (e) {
            const rect = canvasLocal.getBoundingClientRect();
            onMouseMove(e.clientX - rect.left, e.clientY - rect.top);
        });

        canvasLocal.addEventListener("touchmove", function (e) {
            const rect = canvasLocal.getBoundingClientRect();
            onMouseMove(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        });

        // gameStart(); // for quick test
    }

    private updateGameSize() {
        this.gameScale = this.canvas.width / this.gameWidth;
        const r = this.canvas.height / this.canvas.width;
        this.gameHeight = Math.ceil(this.gameWidth * r);
        this.player.y = this.gameHeight - this.player.h;
    }

    private loadResources(res: any) {
        for (let i = 0; i < res.length; i++) {
            const url = res[i];

            if (this.images[url] == undefined) {
                const img = new Image();

                img.onload = () => {
                    this.images[url] = img;

                    if (i === res.length - 1) {
                        this.initGame();
                    }
                };
                img.src = url;
            } else {
                console.log('image: ' + url + ' is already exists');
            }
        }
    }

    private toggleScreen(id: any, v: any) {
        let element = document.getElementById(id);
        if (!element) return;

        if (!v)
            element.classList.remove("visible")
        else
            element.classList.add("visible")
    }

    private callbackOnStart(millis: number) {
        if (this.lastTime != 0) {
            this.gameUpdate((millis - this.lastTime) / 1000);
            this.gameDraw();
        }
        this.lastTime = millis;
        window.requestAnimationFrame((data) => {
            console.log(data);
            this.callbackOnStart(data);
        });
    };

    private gameUpdate(dt: any) {
        if (!this.gameActive) return;

        this.time += dt;
        this.speed += this.SPEED_PER_MINUTE / (60 * 60);

        if (this.speed > this.speedMax) this.speed = this.speedMax;

        if (this.time >= this.nextGiftSpawnTime) {
            this.nextGiftSpawnTime = this.time + (this.randomFloat(this.giftSpawnTimeMin, this.giftSpawnTimeMax) / this.speed);
            this.createGift();
        }

        if (this.time >= this.nextBubbleSpawnTime) {
            this.nextBubbleSpawnTime = this.time + (this.randomFloat(this.bubbleSpawnTimeMin, this.bubbleSpawnTimeMax) / this.speed);
            this.createBubble();
        }

        this.updateGifts(dt);
        this.updateBubbles(dt);
    }

    private randomFloat(min: any, max: any) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
    }

    private randomInt(min: any, max: any) {
        if (max == null) {
            max = min;
            min = 0;
        }
        return Math.floor(this.randomFloat(min, max));
    }

    private createGift() {
        const w = 48;
        const h = 48;
        const x = this.randomInt(w, this.gameWidth - w);
        const v = 1;
        const av = this.randomFloat(-2, 2);

        const e = {
            image: this.images['assets/images/gift_' + this.randomInt(1, 6) + '.png'],
            x: x,
            y: -h,
            r: 0,
            w: w,
            h: h,
            v: v,
            av: av,
        };
        this.gifts.push(e);
    }

    private createBubble() {
        const w = 48;
        const h = 48;
        const x = this.randomInt(w, this.gameWidth - w);
        const v = 1;

        const e = {
            image: this.images['assets/images/bubble.png'],
            x: x,
            startX: x,
            y: -h,
            r: 0,
            w: w,
            h: h,
            v: v,
        };
        this.bubbles.push(e);
    }

    private updateGifts(dt: any) {
        for (let i = 0; i < this.gifts.length; i++) {
            const e = this.gifts[i];
            e.y += e.v * this.speed * this.speedMult * dt;
            e.r += e.av;

            if (this.playerCollideWithElement(e)) {
                // score++;
                this.giftsToRemove.push(e);
                this.addScore(1);
            }

            if (e.y - e.h > this.gameHeight) {
                this.giftsToRemove.push(e);
                this.removeLife(1);
            }
        }

        if (this.giftsToRemove.length > 0) {
            let rem = this.giftsToRemove.pop();
            while (rem !== undefined) {
                const idx = this.gifts.indexOf(rem);
                if (idx >= 0) this.gifts.splice(idx, 1);
                // console.log('remove gift: ' + rem);
                rem = this.giftsToRemove.pop();
            }
        }
    }

    private playerCollideWithElement(e: any) {
        return e.y < (this.player.y + 24) && this.collide(e.x, e.y, e.w / 2, this.player.x, this.player.y + this.player.h, this.player.w / 2, this.player.h / 2);
    }

    private collide(cx: any, cy: any, cr: any, bx: any, by: any, bhw: any, bhh: any) {
        let cx_ = cx;
        let cy_ = cy;

        let minx = bx - bhw;
        let miny = by - bhh;
        let maxx = bx + bhw;
        let maxy = by + bhh;

        if (cx < minx) cx = minx;
        if (cx > maxx) cx = maxx;
        if (cy < miny) cy = miny;
        if (cy > maxy) cy = maxy;

        let dx = cx_ - cx;
        let dy = cy_ - cy;

        return (dx * dx + dy * dy < cr * cr);
    }

    private addScore(amount: any) {
        this.score += amount;
        if (this.score > this.FINISH_SCORE) this.score = this.FINISH_SCORE;
        this.progress = this.score / this.FINISH_SCORE;
        if (this.score === this.FINISH_SCORE) this.gameWin();
    }

    private removeScore(amount: any) {
        this.score -= amount;
        if (this.score < 0) this.score = 0;
    }

    private gameWin() {
        this.toggleScreen('start-screen', false);
        // this.toggleScreen('catchGame',false);
        this.toggleScreen('gamewin-screen', true);
        this.toggleScreen('gameover-screen', false);

        this.gameActive = false;
        this.gameFinished = true;
    }

    private removeLife(amount: any) {
        this.lives -= amount;
        if (this.lives <= 0) this.gameOver();
    }

    private gameOver() {
        this.toggleScreen('start-screen', false);
        // this.toggleScreen('catchGame',false);
        this.toggleScreen('gamewin-screen', false);
        this.toggleScreen('gameover-screen', true);

        this.gameActive = false;
    }

    private updateBubbles(dt: any) {
        for (let i = 0; i < this.bubbles.length; i++) {
            const e = this.bubbles[i];
            e.y += e.v * this.speed * this.speedMult * dt;
            e.x = e.startX + 48 * Math.sin(this.time * 2);

            if (this.playerCollideWithElement(e)) {
                this.bubblesToRemove.push(e);
                // removeScore(3);
                this.removeLife(1);
            }

            if (e.y - e.h > this.gameHeight) {
                this.bubblesToRemove.push(e);
            }
        }

        if (this.bubblesToRemove.length > 0) {
            let rem = this.bubblesToRemove.pop();
            while (rem !== undefined) {
                const idx = this.bubbles.indexOf(rem);
                if (idx >= 0) this.bubbles.splice(idx, 1);
                // console.log('remove gift: ' + rem);
                rem = this.bubblesToRemove.pop();
            }
        }
    }

    private gameDraw() {
        if (!this.gameActive) return;

        this.ctx.drawImage(this.images['assets/images/bg.png'], 0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.scale(this.gameScale, this.gameScale);

        this.drawElements(this.gifts);
        this.drawElements(this.bubbles);
        this.drawPlayer();
        this.drawLives();
        this.drawProgress();

        this.ctx.restore();
    }

    private drawElements(elements: any) {
        for (let i = 0; i < elements.length; i++) {
            const e = elements[i];

            this.ctx.translate(e.x, e.y);
            this.ctx.rotate(e.r * 0.0174532925199432781);
            this.ctx.drawImage(e.image, -(e.w / 2), -(e.h / 2), e.w, e.h);
            this.ctx.rotate(-(e.r * 0.0174532925199432781));
            this.ctx.translate(-e.x, -e.y);
        }
    }

    private drawPlayer() {
        this.ctx.drawImage(this.images['assets/images/player.png'], this.player.x - this.player.w / 2, this.player.y, this.player.w, this.player.h);
    }

    private drawLives() {
        let ox = 16;
        let oy = 16;
        const imgSize = 24;
        const mrg = 8;
        const heart = this.images['assets/images/heart.png'];
        const heartBg = this.images['assets/images/heart_bg.png'];
        let img = heart;

        for (let i = 0; i < this.livesMax; i++) {
            if (i + 1 > this.lives) {
                img = heartBg;
            } else {
                img = heart;
            }
            this.ctx.drawImage(img, ox + i * (imgSize + mrg), oy, imgSize, imgSize);
        }
    }

    private drawProgress() {
        const prBg = this.images['assets/images/progress_bar_bg.png'];
        const pr = this.images['assets/images/progress_bar.png'];
        const oy = 16;
        const pbgW = this.gameWidth / 2;
        const ph = 24;
        const pw = pbgW * this.progress;
        const sPos = this.gameWidth / 2 - pbgW / 2;
        const capSize = ph / 8;

        this.ctx.drawImage(prBg, 17, 0, 30, 128, capSize + sPos, oy, pbgW, ph);
        this.ctx.drawImage(prBg, 0, 0, 16, 128, sPos, oy, capSize, ph);
        this.ctx.drawImage(prBg, 48, 0, 16, 128, sPos + pbgW + capSize, oy, capSize, ph);

        this.ctx.drawImage(pr, capSize + sPos, oy + capSize, pw, ph - capSize * 2);

        this.ctx.drawImage(this.images['assets/images/gift_icon.png'], sPos + pbgW + 16, oy, ph, ph);
    }
}
