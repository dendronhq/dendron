import path from "path";
import { LookupController } from "../components/lookup/LookupController";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = LookupController;

export class GoDownCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const ws = DendronWorkspace.instance();
    const controller = new LookupController(ws, { flavor: "note" });
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    let value = "";
    if (maybeTextEditor) {
      value = path.basename(maybeTextEditor.document.uri.fsPath, ".md") + ".";
      if (value === "root.") {
        value = "";
      }
    }
    controller.show({ value });
    return controller;
  }
}
