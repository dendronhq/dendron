import fs from "fs-extra";
import path from "path";
import { window, workspace } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { getPortFilePath } from "@dendronhq/engine-server";
import { clipboard } from "../utils";
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
    const firstLines = logFile.slice(0, 5000);
    const lastLines = logFile.slice(-5000, -1);

    const serverLogPath = path.join(
      path.dirname(logPath),
      "dendron.server.log"
    );
    const serverLogFile = fs.readFileSync(serverLogPath, { encoding: "utf8" });
    const serverLastLines = serverLogFile.slice(-3000, -1);

    const config = JSON.stringify(getWS().config);
    const wsRoot = DendronWorkspace.wsRoot();
    const port = getPortFilePath({ wsRoot });
    const portFromFile = fs.readFileSync(port, { encoding: "utf8" });

    const content = [
      "# Plugin Logs",
      firstLines,
      "---",
      lastLines,
      "---",
      "# Server Logs",
      serverLastLines,
      "# Dendron Confg",
      config,
      "# Port",
      portFromFile,
    ].join("\n");
    await workspace.openTextDocument({ language: "markdown", content });
    await clipboard.writeText(content);
    return;
  }

  async showResponse() {
    window.showInformationMessage("diagnostics report copied to clipboard");
  }
}
