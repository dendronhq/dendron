import {
  DendronError,
  DNodeUtils,
  isNumeric,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { direction: "next" | "prev" };
export { CommandOpts as GoToSiblingCommandOpts };

type CommandOutput = { msg: "ok" | "no_editor" | "no_siblings" };

export class GoToSiblingCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = "dendron.goToSibling";

  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(opts: CommandOpts) {
    const ctx = "GoToSiblingCommand";
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!maybeTextEditor) {
      window.showErrorMessage("You need to be in a note to use this command");
      return {
        msg: "no_editor" as const,
      };
    }
    let value = "";
    value = path.basename(maybeTextEditor.document.uri.fsPath, ".md");
    let respNodes: NoteProps[];

    const { vaults, engine, wsRoot } = getDWorkspace();
    if (value === "root") {
      const vault = VaultUtils.getVaultByNotePath({
        vaults,
        wsRoot,
        fsPath: maybeTextEditor.document.uri.fsPath,
      });
      const rootNode = NoteUtils.getNoteByFnameV5({
        fname: value,
        vault,
        notes: engine.notes,
        wsRoot,
      }) as NoteProps;
      if (_.isUndefined(rootNode)) {
        throw new DendronError({ message: "no root node found" });
      }
      respNodes = rootNode.children
        .map((ent) => engine.notes[ent])
        .concat([rootNode]);
    } else {
      const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
      const note = NoteUtils.getNotesByFname({
        fname: value,
        notes: engine.notes,
        vault,
      })[0] as NoteProps;
      respNodes = engine.notes[note.parent as string].children
        .map((id) => engine.notes[id])
        .filter((ent) => _.isUndefined(ent.stub));
    }

    if (respNodes.length <= 1) {
      window.showInformationMessage(
        "One is the loneliest number. This node has no siblings :( "
      );
      return {
        msg: "no_siblings" as const,
      };
    }

    // check if there are numeric-only nodes
    const numericNodes = _.filter(respNodes, (o) => {
      const leafName = DNodeUtils.getLeafName(o);
      return isNumeric(leafName);
    }) as NoteProps[];

    // determine how much we want to zero-pad the numeric-only node names
    let padLength = 0;
    if (numericNodes.length > 0) {
      const sortedNumericNodes = _.orderBy(
        numericNodes,
        (o) => {
          return DNodeUtils.getLeafName(o)!.length;
        },
        "desc"
      );
      padLength = sortedNumericNodes[0].fname.length;
    }

    // zero-pad numeric-only nodes before sorting
    const sorted = _.sortBy(respNodes, (o) => {
      const leafName = DNodeUtils.getLeafName(o);
      if (isNumeric(leafName)) {
        return _.padStart(leafName, padLength, "0");
      }
      return leafName;
    });
    const indexOfCurrentNote = _.findIndex(sorted, { fname: value });
    if (indexOfCurrentNote < 0) {
      throw new Error(`${ctx}: ${UNKNOWN_ERROR_MSG}`);
    }
    let siblingNote;
    if (opts.direction === "next") {
      siblingNote =
        indexOfCurrentNote === respNodes.length - 1
          ? sorted[0]
          : sorted[indexOfCurrentNote + 1];
    } else {
      siblingNote =
        indexOfCurrentNote === 0
          ? sorted.slice(-1)[0]
          : sorted[indexOfCurrentNote - 1];
    }
    const vpath = vault2Path({
      vault: siblingNote.vault,
      wsRoot: getDWorkspace().wsRoot,
    });
    await VSCodeUtils.openFileInEditor(
      VSCodeUtils.joinPath(Uri.file(vpath), siblingNote.fname + ".md")
    );
    return { msg: "ok" as const };
  }
}
