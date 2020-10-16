import {
  DendronError,
  DNodeUtils,
  DNodeUtilsV2,
  ENGINE_ERROR_CODES,
  Note,
  NoteChangeEntry,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { mdFile2NodeProps } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { TextEditor, Uri, window } from "vscode";
import { FileItem } from "../external/fileutils/FileItem";
import { HistoryService } from "../services/HistoryService";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

type CommandInput = {
  dest: string;
};
type CommandOpts = {
  files: { oldUri: Uri; newUri: Uri }[];
  silent: boolean;
  closeCurrentFile: boolean;
  openNewFile: boolean;
  noModifyWatcher?: boolean;
};
type CommandOutput = {
  changed: NoteChangeEntry[];
};

export { CommandOutput as RenameNoteOutputV2a };

export class RenameNoteV2aCommand extends BaseCommand<
  CommandOpts,
  CommandOutput
> {
  public silent?: boolean;

  async gatherInputs(): Promise<CommandInput | undefined> {
    const resp = await VSCodeUtils.showInputBox({
      prompt: "Rename file",
      ignoreFocusOut: true,
      value: path.basename(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
        ".md"
      ),
    });
    if (_.isUndefined(resp)) {
      return;
    }
    return {
      dest: resp as string,
    };
  }

  async enrichInputs(inputs: CommandInput): Promise<CommandOpts> {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const ws = DendronWorkspace.instance();
    const notes = ws.getEngine().notes;
    let newNote = NoteUtilsV2.getNoteByFname(inputs.dest, notes);
    let isStub = newNote?.stub;
    if (newNote && !isStub) {
      throw new DendronError({
        status: ENGINE_ERROR_CODES.NODE_EXISTS,
        friendly: `${inputs.dest} exists`,
      });
    }
    newNote = NoteUtilsV2.create({ fname: inputs.dest, id: newNote?.id });
    const newUri = Uri.file(
      path.join(ws.rootWorkspace.uri.fsPath, inputs.dest + ".md")
    );
    return {
      files: [{ oldUri, newUri }],
      silent: false,
      closeCurrentFile: true,
      openNewFile: true,
    };
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async moveNote(oldUri: Uri, newUri: Uri) {
    // create new note
    const ws = DendronWorkspace.instance();
    const noteOld = DNodeUtils.getNoteByFname(
      DNodeUtils.uri2Fname(oldUri),
      ws.engine,
      { throwIfEmpty: true }
    ) as Note;
    const props = mdFile2NodeProps(oldUri.fsPath);
    const newFname = DNodeUtils.uri2Fname(newUri);
    const noteNew = new Note({
      ...props,
      parent: null,
      children: [],
      id: noteOld.id,
      fname: newFname,
    });

    // delete old note
    await ws.engine.delete(noteOld.id, "note");
    const historyService = HistoryService.instance();
    historyService.add({ source: "engine", action: "create", uri: newUri });

    // write new note
    await ws.engine.write(noteNew, { newNode: true, parentsAsStubs: true });
  }

  async showResponse(res: CommandOutput) {
    const { changed } = res;
    if (changed.length > 0 && !this.silent) {
      window.showInformationMessage(`Dendron updated ${changed.length} files`);
    }
  }

  async execute(opts: CommandOpts) {
    const ctx = "RenameNoteV2a";
    this.L.info({ ctx, msg: "enter", opts });
    const ws = DendronWorkspace.instance();
    try {
      const { files } = opts;
      const { newUri, oldUri } = files[0];
      if (ws.vaultWatcher && !opts.noModifyWatcher) {
        ws.vaultWatcher.pause = true;
      }
      const engine = ws.getEngine();

      const resp = await engine.renameNote({
        oldLoc: {
          fname: DNodeUtilsV2.fname(oldUri.fsPath),
          vault: { fsPath: ws.rootWorkspace.uri.fsPath },
        },
        newLoc: {
          fname: DNodeUtilsV2.fname(newUri.fsPath),
          vault: { fsPath: ws.rootWorkspace.uri.fsPath },
        },
      });
      const changed = resp.data as NoteChangeEntry[];

      // re-link
      if (!this.silent) {
        if (opts.closeCurrentFile) {
          await VSCodeUtils.closeCurrentFileEditor();
        }
        opts.openNewFile &&
          (await VSCodeUtils.openFileInEditor(new FileItem(files[0].newUri)));
      }
      return {
        changed,
      };
    } finally {
      if (ws.vaultWatcher && !opts.noModifyWatcher) {
        setTimeout(() => {
          if (ws.vaultWatcher) {
            ws.vaultWatcher.pause = false;
          }
          this.L.info({ ctx, msg: "exit" });
        }, 3000);
      }
    }
  }
}
