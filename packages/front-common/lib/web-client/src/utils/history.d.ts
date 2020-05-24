import { createBrowserHistory as createHistory } from "history";
declare type BrowserHistory = ReturnType<typeof createHistory>;
export declare function getOrCreateHistory(): BrowserHistory;
export {};
