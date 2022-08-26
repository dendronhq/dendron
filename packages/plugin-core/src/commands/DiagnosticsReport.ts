import fs from "fs-extra";
import path from "path";
import { window, workspace } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { clipboard } from "../utils";
import { DendronExtension } from "../workspace";
import { BasicCommand } from "./base";

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

    let serverLastLines: string = "";
    if (fs.pathExistsSync(serverLogPath)) {
      const serverLogFile = fs.readFileSync(serverLogPath, {
        encoding: "utf8",
      });
      serverLastLines = serverLogFile.slice(-5000);
    }

    const ext = ExtensionProvider.getExtension();
    const config = ext.getDWorkspace().config.toString();
    const port = ext.port;

    let wsFile: string;
    try {
      const workspaceFile = DendronExtension.workspaceFile().fsPath;
      wsFile = await fs.readFile(workspaceFile, { encoding: "utf8" });
    } catch {
      // Workspace file is missing, may be a native workspace
      wsFile = "<!-- workspace file doesn't exist -->";
    }

    const content = [
      "# Plugin Logs",
      firstLines,
      "---",
      lastLines,
      "---",
      "# Server Logs",
      serverLastLines,
      "# Dendron Config",
      config,
      "# Port",
      port,
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
