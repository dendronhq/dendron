import { Uri, workspace, window } from "vscode";
import { Logger } from "../logger";
import { BaseCommand } from "./base";
const L = Logger;

type OpenLogsCommandOpts = {
};

export class OpenLogsCommand extends BaseCommand<OpenLogsCommandOpts, void> {
  async execute(opts: OpenLogsCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const logPath = Logger.logPath;
    if (!logPath) {
        throw Error("logPath not defined");
    }
    const doc= await workspace.openTextDocument(Uri.file(logPath));
    window.showTextDocument(doc);
    return;
  }
}
