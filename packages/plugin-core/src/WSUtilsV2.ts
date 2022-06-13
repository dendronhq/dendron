import { IDendronExtension } from "./dendronExtensionInterface";
import vscode, { Position, Selection, TextEditor } from "vscode";
import path from "path";
import {
  DendronError,
  DNoteAnchorBasic,
  DVault,
  NoteProps,
  NoteUtils,
  RespV3,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import { ExtensionProvider } from "./ExtensionProvider";
import { isInsidePath, vault2Path } from "@dendronhq/common-server";
import { AnchorUtils, WorkspaceUtils } from "@dendronhq/engine-server";

let WS_UTILS: IWSUtilsV2 | undefined;

/**
 *
 *  Utilities to work with workspace related functions
 **/
export class WSUtilsV2 implements IWSUtilsV2 {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  getVaultFromPath(fsPath: string): DVault {
    const { wsRoot, vaults } = this.extension.getDWorkspace();
    return VaultUtils.getVaultByFilePath({
      wsRoot,
      vaults,
      fsPath,
    });
  }

  getNoteFromPath(fsPath: string): NoteProps | undefined {
    const { engine } = this.extension.getDWorkspace();
    const fname = path.basename(fsPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromPath(fsPath);
    } catch (err) {
      // No vault
      return undefined;
    }
    return NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    });
  }

  /**
   * Prefer NOT to use this method and instead get WSUtilsV2 passed in as
   * dependency or use IDendronExtension.wsUtils.
   *
   * This method exists to satisfy static method of WSUtils while refactoring
   * is happening and we are moving method to this class.
   * */
  static instance() {
    if (WS_UTILS === undefined) {
      WS_UTILS = new WSUtilsV2(ExtensionProvider.getExtension());
    }
    return WS_UTILS;
  }

  getVaultFromUri(fileUri: vscode.Uri): DVault {
    const { vaults } = this.extension.getDWorkspace();
    const vault = VaultUtils.getVaultByFilePath({
      fsPath: fileUri.fsPath,
      vaults,
      wsRoot: this.extension.getDWorkspace().wsRoot,
    });
    return vault;
  }

  getNoteFromDocument(document: vscode.TextDocument) {
    const { engine } = this.extension.getDWorkspace();
    const txtPath = document.uri.fsPath;
    const fname = path.basename(txtPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromDocument(document);
    } catch (err) {
      // No vault
      return undefined;
    }
    return NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    });
  }

  /**
   * See {@link IWSUtilsV2.promptForNoteAsync}.
   */
  async promptForNoteAsync(opts: {
    notes: NoteProps[];
    quickpickTitle: string;
    nonStubOnly?: boolean;
  }): Promise<RespV3<NoteProps | undefined>> {
    const { notes, quickpickTitle, nonStubOnly = false } = opts;
    let existingNote: NoteProps | undefined;

    const filteredNotes = nonStubOnly
      ? notes.filter((note) => !note.stub)
      : notes;

    if (filteredNotes.length === 1) {
      // Only one match so use that as note
      existingNote = filteredNotes[0];
    } else if (filteredNotes.length > 1) {
      // If there are multiple notes with this fname, prompt user to select which vault
      const vaults = filteredNotes.map((noteProps) => {
        return {
          vault: noteProps.vault,
          label: `${noteProps.fname} from ${VaultUtils.getName(
            noteProps.vault
          )}`,
        };
      });

      const items = vaults.map((vaultPickerItem) => ({
        ...vaultPickerItem,
        label: vaultPickerItem.label
          ? vaultPickerItem.label
          : vaultPickerItem.vault.fsPath,
      }));
      const resp = await vscode.window.showQuickPick(items, {
        title: quickpickTitle,
      });

      if (!_.isUndefined(resp)) {
        existingNote = _.find(filteredNotes, { vault: resp.vault });
      } else {
        // If user escaped out of quickpick, then do not return error. Return undefined note instead
        return {
          data: existingNote,
        };
      }
    } else {
      return {
        error: new DendronError({
          message: `No note found`,
        }),
      };
    }
    return {
      data: existingNote,
    };
  }

  getVaultFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const { wsRoot, vaults } = this.extension.getDWorkspace();
    const vault = VaultUtils.getVaultByFilePath({
      wsRoot,
      vaults,
      fsPath: txtPath,
    });
    return vault;
  }

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined {
    const { wsRoot, vaults } = this.extension.getDWorkspace();
    if (
      !WorkspaceUtils.isPathInWorkspace({
        wsRoot,
        vaults,
        fpath: document.uri.fsPath,
      })
    ) {
      Logger.info({
        uri: document.uri.fsPath,
        msg: "not in workspace",
      });
      return;
    }
    try {
      const note = this.getNoteFromDocument(document);
      return note;
    } catch (err) {
      Logger.info({
        uri: document.uri.fsPath,
        msg: "not a valid note",
      });
    }
    return;
  }

  async trySelectRevealNonNoteAnchor(
    editor: TextEditor,
    anchor: DNoteAnchorBasic
  ): Promise<void> {
    let position: Position | undefined;
    switch (anchor.type) {
      case "line":
        // Line anchors are direct line numbers from the start
        position = new Position(anchor.line - 1 /* line 1 is index 0 */, 0);
        break;
      case "block":
        // We don't parse non note files for anchors, so read the document and find where the anchor is
        position = editor?.document.positionAt(
          editor?.document.getText().indexOf(AnchorUtils.anchor2string(anchor))
        );
        break;
      default:
        // not supported for non-note files
        position = undefined;
    }
    if (position) {
      // if we did find the anchor, then select and scroll to it
      editor.selection = new Selection(position, position);
      editor.revealRange(editor.selection);
    }
  }

  getActiveNote() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) return this.getNoteFromDocument(editor.document);
    return;
  }

  /** If the text document at `filePath` is open in any editor, return that document. */
  getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined {
    const { wsRoot } = this.extension.getDWorkspace();
    // Normalize file path for reliable comparison
    if (isInsidePath(wsRoot, filePath)) {
      filePath = path.relative(wsRoot, filePath);
    }
    return vscode.workspace.textDocuments.filter((document) => {
      let documentPath = document.uri.fsPath;
      if (isInsidePath(wsRoot, documentPath)) {
        documentPath = path.relative(wsRoot, documentPath);
      }
      return path.relative(filePath, documentPath) === "";
    })[0];
  }

  async openFileInEditorUsingFullFname(
    vault: DVault,
    fnameWithExtension: string
  ) {
    const wsRoot = this.extension.getDWorkspace().wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const notePath = path.join(vpath, fnameWithExtension);
    const editor = await VSCodeUtils.openFileInEditor(
      vscode.Uri.file(notePath)
    );
    return editor as vscode.TextEditor;
  }

  async openNote(note: NoteProps) {
    const { vault, fname } = note;
    const fnameWithExtension = `${fname}.md`;
    return this.openFileInEditorUsingFullFname(vault, fnameWithExtension);
  }
}
