import { DNodeUtils, Note } from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { Uri, window } from "vscode";
import { UNKNOWN_ERROR_MSG } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = { direction: "next" | "prev" };
export { CommandOpts as GoToSiblingCommandOpts };

type CommandOutput = { msg: "ok" | "no_editor" | "no_siblings" };

export class GoToSiblingCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async gatherInputs(): Promise<any> {
    return {};
  }

  async execute(opts: CommandOpts) {
    const ctx = "GoToSiblingCommand";
    const ws = DendronWorkspace.instance();
    const maybeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!maybeTextEditor) {
      window.showErrorMessage("You need to be in a note to use this command");
      return {
        msg: "no_editor" as const,
      };
    }
    let value = "";
    value = path.basename(maybeTextEditor.document.uri.fsPath, ".md");
    let respNodes: Note[];

    if (value === "root") {
      respNodes = _.uniqBy(
        _.map(_.values(ws.engine.notes), (ent) => ent.domain),
        "domain.id"
      );
    } else {
      const node = DNodeUtils.getNoteByFname(value, ws.engine);
      respNodes = node?.parent?.children as Note[];
      // const nodeParent = DNodeUtils.dirName(value);
      // let qs = `^` + nodeParent + ".";
      // respNodes = (await ws.engine.query(qs, "note")).data as Note[];
    }

    if (respNodes.length <= 1) {
      window.showInformationMessage(
        "One is the loneliest number. This node has no siblings :( "
      );
      return {
        msg: "no_siblings" as const,
      };
    }
    const sorted = _.sortBy(respNodes, "fname");
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
    await VSCodeUtils.openFileInEditor(
      Uri.joinPath(ws.rootWorkspace.uri, siblingNote.fname + ".md")
    );
    return { msg: "ok" as const };
  }
}
