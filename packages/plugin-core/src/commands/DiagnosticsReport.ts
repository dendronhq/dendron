import fs from "fs-extra";
import clipboardy from "@dendronhq/clipboardy";
import path from "path";
import { window, workspace } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { getWS } from "../workspace";
import { BasicCommand } from "./base";
const L = Logger;

type DiagnosticsReportCommandOpts = {};

export class DiagnosticsReportCommand extends BasicCommand<
  DiagnosticsReportCommandOpts,
  void
> {
  static key = DENDRON_COMMANDS.DEV_DIAGNOSTICS_REPORT.key;
  async execute(opts?: DiagnosticsReportCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const logPath = Logger.logPath;
    if (!logPath) {
      throw Error("logPath not defined");
    }
    const logFile = fs.readFileSync(logPath, { encoding: "utf8" });
    const lastLines = logFile.slice(-3000, -1);

    const serverLogPath = path.join(
      path.dirname(logPath),
      "dendron.server.log"
    );
    const serverLogFile = fs.readFileSync(serverLogPath, { encoding: "utf8" });
    const serverLastLines = serverLogFile.slice(-3000, -1);

    const config = JSON.stringify(getWS().config);

    const content = [
      "# Plugin Logs",
      lastLines,
      "---",
      "# Server Logs",
      serverLastLines,
      "# Dendron Confg",
      config,
    ].join("\n");
    await workspace.openTextDocument({ language: "markdown", content });
    clipboardy.writeSync(content);
    return;
  }

  async showResponse() {
    window.showInformationMessage("diagnostics report copied to clipboard");
  }
}
