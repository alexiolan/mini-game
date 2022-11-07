import {Injectable} from "@angular/core";

const ACCESS_KEY = 'auth.access_token';

@Injectable({providedIn: 'root'})
export class AuthService {
    public _access: string | null = null;

    public getAccessToken(): string | null {
        return (this._access ??= localStorage.getItem(ACCESS_KEY));
    }

    public setAccessToken(value: string | null) {
        this._access = value;
        localStorage.setItem(ACCESS_KEY, value!);
    }
}