export declare const global: {};
export declare const dev: {
    COGNITO_POOL_ID: string;
    COGNITO_CLIENT_ID: string;
};
export declare const prod: {
    COGNITO_POOL_ID: string;
    COGNITO_CLIENT_ID: string;
};
export declare const config: {
    global: {};
    dev: {
        COGNITO_POOL_ID: string;
        COGNITO_CLIENT_ID: string;
    };
    prod: {
        COGNITO_POOL_ID: string;
        COGNITO_CLIENT_ID: string;
    };
};
export declare type ConfigKey = keyof typeof dev;
