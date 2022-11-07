export interface IConfig {
    api: IEndpoint;
}

export interface IEndpoint {
    token: string;
    url: string;
}