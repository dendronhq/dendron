import { OutputChannel, ExtensionContext, window } from "vscode";
import { DENDRON_CHANNEL_NAME } from "./constants";

export enum TraceLevel {
    Silent = 'silent',
    Errors = 'errors',
    Verbose = 'verbose',
    Debug = 'debug'
}

export class Logger {
    static output: OutputChannel | undefined;
    static customLoggableFn: ((o: object) => string | undefined) | undefined;
    static configure(context: ExtensionContext, level: TraceLevel, loggableFn?: (o: any) => string | undefined) {
        this.customLoggableFn = loggableFn;
        this.level = level;
    }
    private static _level: TraceLevel = TraceLevel.Silent;

    static get level() {
        return this._level;
    }
    static set level(value: TraceLevel) {
        this._level = value;
        if (value === TraceLevel.Silent) {
            if (this.output !== undefined) {
                this.output.dispose();
                this.output = undefined;
            }
        } else {
            this.output = this.output || window.createOutputChannel(DENDRON_CHANNEL_NAME);
        }
    }

    static debug(msg: any) {
        this.output?.appendLine(JSON.stringify(msg));
    }

    private static _isDebugging: boolean | undefined;
    static get isDebugging() {
        if (this._isDebugging === undefined) {
            const env = process.env;
            this._isDebugging =
                env && env.VSCODE_DEBUGGING_EXTENSION ? true : false
        }

        return this._isDebugging;
    }

}