import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {AuthInterceptor} from './interceptors';

@NgModule({
    imports: [],
    exports: [],
    declarations: [],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        }
    ],
})
export class CoreModule {
}