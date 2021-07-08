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
  key = DENDRON_COMMANDS.DEV_DIAGNOSTICS_REPORT.key;
  async execute(opts?: DiagnosticsReportCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const logPath = Logger.logPath;
    if (!logPath) {
      throw Error("logPath not defined");
    }
    const logFile = fs.readFileSync(logPath, { encoding: "utf8" });
    const firstLines = logFile.slice(0, 10000);
    const lastLines = logFile.slice(-10000);

    const serverLogPath = path.join(
      path.dirname(logPath),
      "dendron.server.log"
    );
    const serverLogFile = fs.readFileSync(serverLogPath, { encoding: "utf8" });
    const serverLastLines = serverLogFile.slice(-3000);

    const config = JSON.stringify(getWS().config);
    const wsRoot = DendronWorkspace.wsRoot();
    const port = getPortFilePath({ wsRoot });
    const portFromFile = fs.readFileSync(port, { encoding: "utf8" });

    const workspaceFile = DendronWorkspace.workspaceFile().fsPath;
    const wsFile = fs.readFileSync(workspaceFile, { encoding: "utf8" });

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
      "# Workspace File",
      wsFile,
    ].join("\n");
    const document = await workspace.openTextDocument({
      language: "markdown",
      content,
    });
    await window.showTextDocument(document);
    await clipboard.writeText(content);
    return;
  }

  async showResponse() {
    window.showInformationMessage("diagnostics report copied to clipboard");
  }
}
