import {HttpClient} from "@angular/common/http";
import {inject, Injectable} from "@angular/core";
import {ConfigService} from "./config.service";
import {IReward, ISettings} from "../interfaces";
import {lastValueFrom} from "rxjs";

@Injectable({providedIn: 'root'})
export class GameService {
    protected readonly configService = inject(ConfigService);

    constructor(private http: HttpClient) {
    }

    getSettings(): Promise<ISettings> {
        const url = `${this.configService.config.api.url}/setting?populate=*`;

        const a = lastValueFrom<ISettings>(this.http.get<ISettings>(url)).then((res: any) => {
            return res.data.attributes;
        })

        return a;
    }

    claim(email: string): Promise<IReward> {
        const url = `${this.configService.config.api.url}/game/claim?email=${email}`;

        return lastValueFrom<IReward>(this.http.get<IReward>(url)).then((res: any) => {
            return res
        })
    }
}