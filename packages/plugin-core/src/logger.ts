import { DendronError, error2PlainObject, setEnv } from "@dendronhq/common-all";
import { createLogger, genHash } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { ExtensionContext, OutputChannel, window, workspace } from "vscode";
import { CONFIG, DENDRON_CHANNEL_NAME } from "./constants";
import * as Sentry from "@sentry/node";

export type TraceLevel = "debug" | "info" | "warn" | "error" | "fatal";
const levels = ["debug", "info", "warn", "error", "fatal"];
export type LogPayload = Partial<{
  ctx: string;
  error: DendronError;
  msg: string;
}>;

export const UNKNOWN_ERROR_MSG = `You found a bug! We didn't think this could happen but you proved us wrong. Please file the bug here -->  https://github.com/dendronhq/dendron/issues/new?assignees=&labels=&template=bug_report.md&title= We will put our best bug exterminators on this right away!`;

export class Logger {
  static output: OutputChannel | undefined;
  static logger: ReturnType<typeof createLogger> | undefined;
  static logPath?: string;

  static configure(context: ExtensionContext, level: TraceLevel) {
    const ctx = "Logger:configure";
    fs.ensureDirSync(context.logPath);
    const logPath = path.join(context.logPath, "dendron.log");
    if (fs.existsSync(logPath)) {
      try {
        fs.moveSync(logPath, `${logPath}.old`, { overwrite: true });
      } catch {
        Logger.error({
          ctx,
          msg: `Unable to rename ${logPath}. Logs will be appended.`,
        });
      }
    }
    fs.ensureFileSync(logPath);
    const conf = workspace.getConfiguration();
    const logLevel = conf.get<string>(CONFIG.LOG_LEVEL.key) || "info";
    setEnv("LOG_DST", logPath);
    setEnv("LOG_LEVEL", logLevel);
    Logger.logPath = logPath;
    this.logger = createLogger("dendron", logPath);
    this.level = level;
    Logger.info({ ctx, msg: "exit", logLevel });
  }
  private static _level: TraceLevel = "debug";

  /**
   * Shortcut to check if logger is set to debug
   */
  static isDebug(): boolean {
    return Logger.level === "debug";
  }

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
    this.output =
      this.output || window.createOutputChannel(DENDRON_CHANNEL_NAME);
  }

  static error(payload: LogPayload) {
    Logger.log(payload, "error");

    Sentry.withScope(scope => {
      scope.setExtra("ctx", payload.ctx);
      if (payload.error) {
        scope.setExtra("name", payload.error.name);
        scope.setExtra("message", payload.error.message);
        scope.setExtra("payload", payload.error.payload);
        scope.setExtra("severity", payload.error.severity?.toString());
        scope.setExtra("code", payload.error.code);
        scope.setExtra("status", payload.error.status);
        // scope.setExtra("isComposite", payload.error.isComposite);
      }
      const cleanMsg =
      (payload.error ? payload.error.message : payload.msg) || customStringify(payload);

      if (payload.error?.error) {
        Sentry.captureException(payload.error?.error);
      }
      else {
        Sentry.captureMessage(cleanMsg);
      }
    })
  }

  static info(payload: any, show?: boolean): void {
    Logger.log(payload, "info", { show });

    // TODO: Expand on common PII fields. Move to common function
    if (payload.editor) {
      payload.editor = genHash(payload.editor);
    }

    Sentry.addBreadcrumb({
      category: "plugin",
      message: customStringify(payload),
      level: Sentry.Severity.Info
    });
  }

  static infoSensitive(payload: any, nonPiiPayload: any, show?: boolean) {
    Logger.log(payload, "info", { show });
    Sentry.addBreadcrumb({
      category: "plugin",
      message: customStringify(nonPiiPayload),
      level: Sentry.Severity.Info
    });
  }

//   function makeDate(timestamp: number): Date;
// function makeDate(m: number, d: number, y: number): Date;
// function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
//   if (d !== undefined && y !== undefined) {
//     return new Date(y, mOrTimestamp, d);
//   } else {
//     return new Date(mOrTimestamp);
//   }
// }

  static debug(payload: any) {
    Logger.log(payload, "debug");
  }

  static log = (
    payload: LogPayload,
    lvl: TraceLevel,
    _opts?: { show?: boolean }
  ) => {
    if (Logger.cmpLevel(lvl)) {
      if (payload.error) {
        payload.error = error2PlainObject(payload.error);
      }
      const stringMsg = customStringify(payload);
      Logger.logger?.[lvl](payload);
      Logger.output?.appendLine(lvl + ": " + stringMsg);
      // FIXME: disable for now
      const shouldShow = false; // getStage() === "dev" && cleanOpts.show;
      if (shouldShow || Logger.cmpLevels(lvl, "error")) {
        const cleanMsg =
          (payload.error ? payload.error.message : payload.msg) || stringMsg;
        if (Logger.cmpLevels(lvl, "error")) {
          window.showErrorMessage(cleanMsg);
        } else if (Logger.cmpLevels(lvl, "info")) {
          window.showInformationMessage(cleanMsg);
        }
      }
    }
  };
}

const customStringify = function (v: any) {
  const cache = new Set();
  return JSON.stringify(v, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Circular reference found
        try {
          // If this value does not reference a parent it can be deduped
          return JSON.parse(JSON.stringify(value));
        } catch (err) {
          // discard key if value cannot be deduped
          return;
        }
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
};
