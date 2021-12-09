import {
  DLink,
  DVault,
  EngineDeletePayload,
  NoteProps,
  NoteUtils,
  SchemaUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { TextEditor, ViewColumn, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getEngine, getExtension } from "../workspace";
import { BasicCommand } from "./base";
import _md from "markdown-it";

type CommandOpts = {
  _fsPath?: string;
  noConfirm?: boolean;
};

type CommandOutput = EngineDeletePayload | void;

function formatDeletedMsg({
  fsPath,
  vault,
}: {
  fsPath: string;
  vault: DVault;
}) {
  return `${path.basename(fsPath)} (${VaultUtils.getName(vault)}) deleted`;
}

const md = _md();

export class DeleteNodeCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.DELETE_NODE.key;
  async gatherInputs(): Promise<any> {
    return {};
  }

  async showNoteDeletePreview(note: NoteProps, backlinks: DLink[]) {
    let content = [
      "# Delete Node Preview",
      "```",
      `node type: note`,
      "",
      `# of backlinks to this note: ${backlinks.length}`,
      "```",
      "## Broken links after deletion",
      `These links will be broken after deleting _*${note.fname}*_`,
      "",
      `Make sure to convert the broken links listed below accordingly.`,
      "",
    ];

    _.forEach(_.sortBy(backlinks, ["from.vaultName"]), (backlink) => {
      const entry = [
        `- in **${backlink.from.vaultName}/${backlink.from.fname}**`,
        `  - line *${backlink.position?.start.line}* column *${backlink.position?.start.column}*`,
        `  - alias: \`${backlink.alias ? backlink.alias : "None"}\``,
      ].join("\n");
      content = content.concat(entry);
    });

    const panel = window.createWebviewPanel(
      "deleteNodeNoteDeletePreview",
      "Note Delete Preview",
      ViewColumn.One,
      {}
    );
    panel.webview.html = md.render(content.join("\n"));
  }

  async promptConfirmation(title: string, noConfirm?: boolean) {
    if (noConfirm) return true;
    const options = ["Proceed", "Cancel"];
    const resp = await VSCodeUtils.showQuickPick(options, {
      title,
      placeHolder: "Proceed",
      ignoreFocusOut: true,
    });
    return resp === "Proceed";
  }

  async execute(opts?: CommandOpts): Promise<CommandOutput> {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const ctx = "DeleteNoteCommand";
    if ((opts && opts._fsPath) || editor) {
      const fsPath =
        opts && opts._fsPath
          ? opts._fsPath
          : VSCodeUtils.getFsPathFromTextEditor(editor);
      const mode = fsPath.endsWith(".md") ? "note" : "schema";
      const trimEnd = mode === "note" ? ".md" : ".schema.yml";
      const fname = path.basename(fsPath, trimEnd);
      const client = getExtension().getEngine();
      if (mode === "note") {
        const vault = PickerUtilsV2.getVaultForOpenEditor();
        const note = NoteUtils.getNoteByFnameV5({
          fname,
          vault,
          notes: getEngine().notes,
          wsRoot: getDWorkspace().wsRoot,
        }) as NoteProps;

        const backlinks = note.links.filter((link) => link.type === "backlink");
        let title;
        if (backlinks.length === 0) {
          // no need to show preview a simple
          title = `Delete note ${note.fname}?`;
        } else {
          await this.showNoteDeletePreview(note, backlinks);
          title = `${note.fname} has backlinks. Delete note?`;
        }

        const shouldProceed = await this.promptConfirmation(
          title,
          opts?.noConfirm
        );
        if (!shouldProceed) {
          window.showInformationMessage("Cancelled");
          return;
        }

        const out = (await client.deleteNote(note.id)) as EngineDeletePayload;
        if (out.error) {
          Logger.error({ ctx, msg: "error deleting node", error: out.error });
          return;
        }
        window.showInformationMessage(
          formatDeletedMsg({ fsPath, vault: note.vault })
        );
        return out;
      } else {
        const smod = await DendronClientUtilsV2.getSchemaModByFname({
          fname,
          client,
        });
        await client.deleteSchema(SchemaUtils.getModuleRoot(smod).id);
        window.showInformationMessage(
          formatDeletedMsg({ fsPath, vault: smod.vault })
        );
        return;
      }
    } else {
      window.showErrorMessage("no active text editor");
      return;
    }
  }
}
