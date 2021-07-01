import { DNodeUtils, NoteProps, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};

type CommandOutput = void;

export class GoUpCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GO_UP_HIERARCHY.key;
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
    const nparent = DNodeUtils.findClosestParent(
      path.basename(maybeTextEditor.document.uri.fsPath, ".md"),
      _.values(engine.notes),
      {
        noStubs: true,
        vault: PickerUtilsV2.getVaultForOpenEditor(),
        wsRoot: DendronWorkspace.wsRoot(),
      }
    ) as NoteProps;
    const nppath = NoteUtils.getFullPath({
      note: nparent,
      wsRoot: DendronWorkspace.wsRoot(),
    });
    await VSCodeUtils.openFileInEditor(Uri.file(nppath));
    return;
  }
}
