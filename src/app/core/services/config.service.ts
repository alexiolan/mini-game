import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {IConfig} from "../interfaces";
import {lastValueFrom} from "rxjs";

@Injectable({providedIn: 'root'})
export class ConfigService {
    public config!: IConfig;

    constructor(private http: HttpClient) {
    }

    load() {
        return lastValueFrom(this.http.get<IConfig>('/assets/config.json'))
            .then(data => {
                this.config = data;
            })
            .catch(() => {
            });
    }
}