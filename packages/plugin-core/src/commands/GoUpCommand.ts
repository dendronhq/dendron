import { DNodeUtils, Note } from "@dendronhq/common-all";
import _ from "lodash";
import { window, Uri } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import path from "path";

type CommandOpts = {};

type CommandOutput = void;

export class GoUpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  async gatherInputs(): Promise<any> {
    return {};
  }
  async execute() {
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (_.isUndefined(maybeTextEditor)) {
      window.showErrorMessage("no active document found");
      return;
    }
    const engine = DendronWorkspace.instance().engine;
    const closetParent = DNodeUtils.findClosestParent(
      path.basename(maybeTextEditor.document.uri.fsPath, ".md"),
      engine.notes,
      {
        noStubs: true,
      }
    );
    const uri = DNodeUtils.node2Uri(closetParent as Note, engine);

    await VSCodeUtils.openFileInEditor(Uri.file(uri.path));
  }
}
