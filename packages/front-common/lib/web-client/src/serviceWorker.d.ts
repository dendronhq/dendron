declare type Config = {
    onSuccess?: (registration: ServiceWorkerRegistration) => void;
    onUpdate?: (registration: ServiceWorkerRegistration) => void;
};
export declare function register(config?: Config): void;
export declare function unregister(): void;
export {};
