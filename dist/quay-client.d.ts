export interface ExchangeTokenOptions {
    hostname: string;
    username: string;
    protocol: string;
    oidcToken: string;
    tlsCertificate?: string;
    verifySsl: boolean;
}
export interface ExchangeTokenResult {
    token: string;
    expiration: string;
}
export declare function getTokenExpiration(token: string): string;
export declare function exchangeToken(options: ExchangeTokenOptions): Promise<ExchangeTokenResult>;
