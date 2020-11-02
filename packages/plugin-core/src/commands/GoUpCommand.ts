import { DNodeUtilsV2, NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

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
    const engine = DendronWorkspace.instance().getEngine();
    const nparent = DNodeUtilsV2.findClosestParent(
      path.basename(maybeTextEditor.document.uri.fsPath, ".md"),
      _.values(engine.notes),
      {
        noStubs: true,
      }
    ) as NotePropsV2;
    const nppath = NoteUtilsV2.getPath({ client: engine, note: nparent });
    await VSCodeUtils.openFileInEditor(Uri.file(nppath));
    return;
  }
}
