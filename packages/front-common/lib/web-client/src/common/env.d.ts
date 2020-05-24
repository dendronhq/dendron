import { ConfigKey } from "./config";
import { Stage } from "./types";
export declare function getStage(): Stage;
export declare function getOrThrow<T = any>(obj: T, k: keyof T): T[keyof T];
export declare function env(name: ConfigKey): any;
