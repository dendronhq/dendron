import { setEnv } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { ExtensionContext, OutputChannel, window } from "vscode";
import { DENDRON_CHANNEL_NAME } from "./constants";
import { VSCodeUtils } from "./utils";

export type TraceLevel = "debug" | "info" | "warn" | "error" | "fatal";
const levels = ["debug", "info", "warn", "error", "fatal"];

export class Logger {
    static output: OutputChannel | undefined;
    static logger: ReturnType<typeof createLogger> | undefined;

    static configure(context: ExtensionContext, level: TraceLevel) {
        fs.ensureDirSync(context.logPath);
        setEnv("LOG_DST", path.join(context.logPath, "dendron.log"));
        this.logger = createLogger("dendron");
        this.level = level;
    }
    private static _level: TraceLevel = "debug";

    static cmpLevel(lvl: TraceLevel): boolean {
        return levels.indexOf(lvl) >= levels.indexOf(Logger.level || "debug");
    }

    static get level() {
        return this._level;
    }
    static set level(value: TraceLevel) {
        this._level = value;
        // if silent, remove output channel
        // if (value === TraceLevel.Silent) {
        //     if (this.output !== undefined) {
        //         this.output.dispose();
        //         this.output = undefined;
        //     }
        // } else {
        this.output = this.output || window.createOutputChannel(DENDRON_CHANNEL_NAME);
        // }
    }

    // private static lvl2Method = (lvl: TraceLevel) => {
    //     return {
    //         [NoSilentTraceLevel.Debug]: 'debug',
    //         [NoSilentTraceLevel.Info]: 'info',
    //         [NoSilentTraceLevel.Warn]: 'warn',
    //         [NoSilentTraceLevel.Error]: 'error',
    //         [NoSilentTraceLevel.Fatal]: 'fatal',
    //     }[lvl];
    // }

    static error(msg: any) {
        Logger.logger?.error(msg);
        this.output?.appendLine("error: " + JSON.stringify(msg));
    }

    static info(msg: any) {
        Logger.logger?.info(msg);
        this.output?.appendLine(JSON.stringify(msg));
    }

    static debug(msg: any) {
        Logger.logger?.debug(msg);
        this.output?.appendLine(JSON.stringify(msg));
    }

    static log(msg: any, lvl: TraceLevel) {
        if (Logger.cmpLevel(lvl)) {
            Logger.logger && Logger.logger[lvl](msg);
            this.output?.appendLine(lvl + ": " + JSON.stringify(msg));
        }
    }

    private static _isDebugging: boolean | undefined;
    static get isDebugging() {
        if (this._isDebugging === undefined) {
            this._isDebugging = VSCodeUtils.isDebuggingExtension();
        }

        return this._isDebugging;
    }

}