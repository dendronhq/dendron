import { setEnv } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import { posix } from "path";
import { ExtensionContext, OutputChannel, window } from "vscode";
import { DENDRON_CHANNEL_NAME } from "./constants";

export type TraceLevel = "debug" | "info" | "warn" | "error" | "fatal";
const levels = ["debug", "info", "warn", "error", "fatal"];

export class Logger {
  static output: OutputChannel | undefined;
  static logger: ReturnType<typeof createLogger> | undefined;

  static configure(context: ExtensionContext, level: TraceLevel) {
    fs.ensureDirSync(context.logPath);
    setEnv("LOG_DST", posix.join(context.logPath, "dendron.log"));
    this.logger = createLogger("dendron");
    this.level = level;
  }
  private static _level: TraceLevel = "debug";

  static cmpLevel(lvl: TraceLevel): boolean {
    return levels.indexOf(lvl) >= levels.indexOf(Logger.level || "debug");
  }

  /**
   * Is lvl1 >= lvl2
   * @param lvl1
   * @param lvl2
   */
  static cmpLevels(lvl1: TraceLevel, lvl2: TraceLevel): boolean {
    return levels.indexOf(lvl1) >= levels.indexOf(lvl2);
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
    this.output =
      this.output || window.createOutputChannel(DENDRON_CHANNEL_NAME);
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
    Logger.log(msg, "error");
  }

  static info(msg: any, show?: boolean) {
    Logger.log(msg, "info", { show });
  }

  static debug(msg: any) {
    Logger.logger?.debug(msg);
    this.output?.appendLine(JSON.stringify(msg));
  }

  static log(msg: any, lvl: TraceLevel, _opts?: { show?: boolean }) {
    if (Logger.cmpLevel(lvl)) {
      Logger.logger && Logger.logger[lvl](msg);
      this.output?.appendLine(lvl + ": " + JSON.stringify(msg));
      // FIXME: disable for now
      const shouldShow = false; // getStage() === "dev" && cleanOpts.show;
      if (shouldShow || Logger.cmpLevels(lvl, "error")) {
        const cleanMsg = JSON.stringify(msg);
        if (Logger.cmpLevels(lvl, "error")) {
          window.showErrorMessage(cleanMsg);
        } else if (Logger.cmpLevels(lvl, "info")) {
          window.showInformationMessage(cleanMsg);
        }
      }
    }
  }
}
