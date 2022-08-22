import {
  error2PlainObject,
  IDendronError,
  setEnv,
} from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import * as Sentry from "@sentry/node";

import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import {
  ExtensionContext,
  OutputChannel,
  Uri,
  window,
  workspace,
} from "vscode";
import { CONFIG, DENDRON_CHANNEL_NAME } from "./constants";
import { FileItem } from "./external/fileutils/FileItem";

export type TraceLevel = "debug" | "info" | "warn" | "error" | "fatal";
const levels = ["debug", "info", "warn", "error", "fatal"];
export type LogPayload = Partial<{
  ctx: string;
  error: IDendronError;
  msg: string;
}>;

export const UNKNOWN_ERROR_MSG = `You found a bug! We didn't think this could happen but you proved us wrong. Please file the bug here -->  https://github.com/dendronhq/dendron/issues/new?assignees=&labels=&template=bug_report.md&title= We will put our best bug exterminators on this right away!`;

// TODO: this is extracted from ./src/utils.ts
// The reason is because `logger` is used in `utils` and importing `VSCodeUtils` inside logger causes a circular dependency
const openFileInEditor = async (
  fileItemOrURI: FileItem | vscode.Uri,
  opts?: Partial<{
    column: vscode.ViewColumn;
  }>
): Promise<vscode.TextEditor | undefined> => {
  let textDocument;
  if (fileItemOrURI instanceof FileItem) {
    if (fileItemOrURI.isDir) {
      return;
    }

    textDocument = await vscode.workspace.openTextDocument(fileItemOrURI.path);
  } else {
    textDocument = await vscode.workspace.openTextDocument(fileItemOrURI);
  }

  if (!textDocument) {
    throw new Error("Could not open file!");
  }

  const col = opts?.column || vscode.ViewColumn.Active;

  const editor = await vscode.window.showTextDocument(textDocument, col);
  if (!editor) {
    throw new Error("Could not show document!");
  }

  return editor;
};

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

  /** Log an error.
   *
   * If an `error` is attached to log payload, the error is also sent to Sentry.
   * This should be used for internal Dendron errors that we can fix, or for
   * problems we assume should never happen.
   *
   * If the error is expected in regular execution, you can log it with
   * {@link Logger.info} instead.
   *
   * If the error is unexpected, but also not something we could fix (i.e. the
   * user misconfigured something), you'll probably want to use
   * {@link Logger.warn} instead. That way we can debug the issue in a bug
   * report by looking at the logs, but it doesn't clog up Sentry.
   */
  static error(payload: LogPayload) {
    Logger.log(payload, "error");

    if (payload.error) {
      // if we log an error, also report it to sentry ^sf0k4z8hnvjo
      Sentry.captureException(payload.error, {
        extra: {
          ctx: payload.ctx,
          name: payload.error.name,
          message: payload.error.message,
          payload: payload.error.payload,
          severity: payload.error.severity?.toString(),
          code: payload.error.code,
          status: payload.error.status,
        },
      });
    } else {
      const cleanMsg = payload.msg || customStringify(payload);
      Sentry.captureMessage(cleanMsg, { extra: { ctx: payload.ctx } });
    }
  }

  static info(payload: any, show?: boolean): void {
    Logger.log(payload, "info", { show });

    Sentry.addBreadcrumb({
      category: "plugin",
      message: customStringify(payload),
      level: "info",
    });
  }

  static debug(payload: any) {
    Logger.log(payload, "debug");
  }

  /** Use this to log an error without submitting it to Sentry.
   *
   * This should be used for errors related to users setup etc., where
   * we wouldn't be able to do anything on our part to fix the problem.
   */
  static warn(payload: any) {
    Logger.log(payload, "warn");
  }

  static log = (
    payload: LogPayload,
    lvl: TraceLevel,
    _opts?: { show?: boolean }
  ) => {
    if (Logger.cmpLevel(lvl)) {
      let stringMsg: string;
      if (_.isString(payload)) {
        stringMsg = payload;
      } else {
        const payloadWithErrorAsPlainObject = {
          ...payload,
          error: payload.error
            ? error2PlainObject(payload.error)
            : payload.error,
        };
        stringMsg = customStringify(payloadWithErrorAsPlainObject);
      }
      Logger.logger?.[lvl](payload);
      Logger.output?.appendLine(lvl + ": " + stringMsg);
      // ^oy9q7tpy0v3t
      // FIXME: disable for now
      const shouldShow = false; // getStage() === "dev" && cleanOpts.show;
      if (shouldShow || Logger.cmpLevels(lvl, "error")) {
        const cleanMsg =
          (payload.error ? payload.error.message : payload.msg) || stringMsg;
        const fullPath = Logger.tryExtractFullPath(payload);

        if (Logger.cmpLevels(lvl, "error")) {
          if (fullPath) {
            // Currently when the user clicks on the action of 'Go to file.' We navigate
            // to the file but the message explaining the error auto closes. For now we will
            // at least set the status bar message to what went wrong.
            window.setStatusBarMessage(cleanMsg);

            const navigateMsg = "Go to file.";
            window.showErrorMessage(cleanMsg, {}, navigateMsg).then((value) => {
              if (value === navigateMsg) {
                openFileInEditor(Uri.file(fullPath));
              }
            });
          } else {
            window.showErrorMessage(cleanMsg);
          }
        } else if (Logger.cmpLevels(lvl, "info")) {
          window.showInformationMessage(cleanMsg);
        }
      }
    }
  };

  /**
   * Extract full path from the payload when it exists in the error
   * otherwise return undefined. This path is meant to be used for user to be
   * able to navigate to the file at fault.
   *   */
  static tryExtractFullPath(payload: LogPayload): string | undefined {
    let fullPath;
    try {
      if (payload.error?.payload) {
        fullPath = JSON.parse(JSON.parse(payload.error?.payload)).fullPath;
      }
    } catch (err) {
      fullPath = undefined;
    }

    return fullPath;
  }
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
