import {Component, inject, OnInit} from '@angular/core';
import {AuthService, ConfigService, GameService} from "./core";

declare var gameStart: any;
declare var setConfigs: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    protected readonly configService = inject(ConfigService);

    public gameFinished = false;
    public canStart = false;

    public userEmail: string = "";
    public rewardTitle: string = "";

    constructor(private gameService: GameService, private authService: AuthService) {
        this.authService.setAccessToken(this.configService.config.api.token)
    }

    ngOnInit(): void {
        this.gameService.getSettings().then(settings => {
            setConfigs(settings);

            this.canStart = true;
        });
    }

    public claimGift() {
        if (!this.gameFinished) return;

        this.gameService.claim(this.userEmail).then(res => {
            this.rewardTitle = res.title;

            this.toggleScreen('gamewin-screen', false);
            this.toggleScreen('reward-screen', true);
        })
    }

    private toggleScreen(id: string, status: boolean) {
        let element = document.getElementById(id);
        if (!element) return;

        if (!status)
            element.classList.remove("visible")
        else
            element.classList.add("visible")
    }

    public gameStart() {
        this.toggleScreen('start-screen', false);
        this.toggleScreen('catchGame', true);
        this.toggleScreen('gameover-screen', false);

        this.gameFinished = false;

        new gameStart();

        document.addEventListener('gameOver', (e) => {
            this.toggleScreen('start-screen', false);
            this.toggleScreen('gamewin-screen', false);
            this.toggleScreen('gameover-screen', true);
        }, false);

        document.addEventListener('gameWin', (e) => {
            this.toggleScreen('start-screen', false);
            this.toggleScreen('gamewin-screen', true);
            this.toggleScreen('gameover-screen', false);

            this.gameFinished = true;
        }, false);
    }
}
