import {inject, Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {AuthService, ConfigService} from "../services";

const TOKEN_HEADER_KEY: string = 'Authorization';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    protected readonly configService = inject(ConfigService);

    constructor(
        private readonly _auth: AuthService,
    ) {

    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<Object>> {
        const token = this._auth.getAccessToken();
        let authReq = req;
        if (token) {
            authReq = this.addTokenHeader(req, token);
        }

        return next.handle(authReq).pipe(catchError(error => {
            return throwError(error);
        }));
    }

    private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({headers: request.headers.set(TOKEN_HEADER_KEY, `Bearer ${token}`)});
    }
}