import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {AuthInterceptor, ConfigService, GameService} from "./core";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {CoreModule} from "./core/core.module";
import {FormsModule} from "@angular/forms";

export function initializerFn(configService: ConfigService) {
    return () => {
        return configService.load();
    };
}

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        HttpClientModule,
        CoreModule,
        BrowserModule,
        FormsModule,
    ],
    providers: [
        {
            provide: APP_INITIALIZER,
            multi: true,
            deps: [ConfigService],
            useFactory: initializerFn
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
