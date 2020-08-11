import { Note, DNodeUtils, DNodeRaw } from "@dendronhq/common-all";
import fs from "fs-extra";
import _, { groupBy } from "lodash";
import path from "path";
import { TextEditor, Uri, window, workspace } from "vscode";
import {
  cacheUris,
  containsMarkdownExt,
  fsPathToRef,
  getWorkspaceCache,
  getWorkspaceFolder,
  replaceRefs,
  sortPaths,
} from "../external/memo/utils/utils";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { HistoryService } from "../services/HistoryService";
import { mdFile2NodeProps } from "@dendronhq/common-server";

type CommandInput = {
  dest: string;
};
type CommandOpts = { files: { oldUri: Uri; newUri: Uri }[]; silent: boolean };
type CommandOutput = {
  refsUpdated: number;
  pathsUpdated: string[];
};

export { CommandOutput as RenameNoteOutput };

// Short ref allowed when non-unique filename comes first in the list of sorted uris.
// /a.md - <-- can be referenced via short ref as [[a]], since it comes first according to paths sorting
// /folder1/a.md - can be referenced only via long ref as [[folder1/a]]
// /folder2/subfolder1/a.md - can be referenced only via long ref as [[folder2/subfolder1/a]]
const isFirstUriInGroup = (pathParam: string, urisGroup: Uri[] = []) =>
  urisGroup.findIndex((uriParam) => uriParam.fsPath === pathParam) === 0;
const getBasename = (pathParam: string) =>
  path.basename(pathParam).toLowerCase();

export class RenameNoteV2Command extends BaseCommand<
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

    // error checking
    let newNote = _.find(_.values(ws.engine.notes), { fname: inputs.dest });
    if (newNote) {
      throw Error(`${inputs.dest} already exists`);
    }

    newNote = new Note({ fname: inputs.dest });
    const newUri = Uri.file(
      path.join(ws.rootWorkspace.uri.fsPath, inputs.dest + ".md")
    );
    return { files: [{ oldUri, newUri }], silent: false };
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
      parent: noteOld.parent,
      children: noteOld.children,
      id: noteOld.id,
      fname: newFname,
    });

    // delete old note
    await ws.engine.delete(noteOld.id, "note");
    const historyService = HistoryService.instance();
    historyService.add({ source: "engine", action: "create", uri: newUri });

    // write new note
    ws.engine.write(noteNew, { newNode: true, parentsAsStubs: true });
    await ws.engine.updateNodes([noteOld], {
      newNode: true,
      parentsAsStubs: true,
    });
  }

  async showResponse(res: CommandOutput) {
    const { pathsUpdated, refsUpdated } = res;
    if (pathsUpdated.length > 0 && !this.silent) {
      window.showInformationMessage(
        `Dendron updated ${refsUpdated} link${
          refsUpdated === 0 || refsUpdated === 1 ? "" : "s"
        } in ${pathsUpdated.length} file${
          pathsUpdated.length === 0 || pathsUpdated.length === 1 ? "" : "s"
        }`
      );
    }
  }

  async execute(opts: CommandOpts) {
    await cacheUris();
    this.silent = opts.silent;

    const { files } = opts;
    const oldFsPaths = await Promise.all(
      files.map(async ({ oldUri }) => {
        return oldUri.fsPath;
      })
    );
    const oldUrisGroupedByBasename = groupBy(
      sortPaths(
        [
          ...getWorkspaceCache().allUris.filter(
            (uri) => !oldFsPaths.includes(uri.fsPath)
          ),
          ...files.map(({ oldUri }) => oldUri),
        ],
        {
          pathKey: "path",
          shallowFirst: true,
        }
      ),
      ({ fsPath }) => path.basename(fsPath).toLowerCase()
    );

    // get new paths
    const newFsPaths = files.map(({ newUri }) => newUri.fsPath);

    // get all paths
    const allUris = [
      // old uris that don't include new uris
      ...getWorkspaceCache().allUris.filter(
        (uri) => !newFsPaths.includes(uri.fsPath)
      ),
      // new uris
      ...files.map(({ newUri }) => newUri),
    ];
    const newUris = sortPaths([...allUris], {
      pathKey: "path",
      shallowFirst: true,
    });
    const newUrisGroupedByBasename = groupBy(newUris, ({ fsPath }) =>
      path.basename(fsPath).toLowerCase()
    );
    let pathsUpdated: string[] = [];

    let refsUpdated: number = 0;
    const incrementRefsCounter = () => (refsUpdated += 1);

    const addToPathsUpdated = (path: string) =>
      (pathsUpdated = [...new Set([...pathsUpdated, path])]);

    // re-link
    await Promise.all(
      files.map(async ({ oldUri, newUri }) => {
        // move note
        await this.moveNote(oldUri, newUri);
        // check if there's link to replace
        const preserveOldExtension = !containsMarkdownExt(oldUri.fsPath);
        const preserveNewExtension = !containsMarkdownExt(newUri.fsPath);
        const workspaceFolder = getWorkspaceFolder()!;
        const oldShortRef = fsPathToRef({
          path: oldUri.fsPath,
          keepExt: preserveOldExtension,
        });
        const oldLongRef = fsPathToRef({
          path: oldUri.fsPath,
          basePath: workspaceFolder,
          keepExt: preserveOldExtension,
        });
        const newShortRef = fsPathToRef({
          path: newUri.fsPath,
          keepExt: preserveNewExtension,
        });
        const newLongRef = fsPathToRef({
          path: newUri.fsPath,
          basePath: workspaceFolder,
          keepExt: preserveNewExtension,
        });
        const oldUriIsShortRef = isFirstUriInGroup(
          oldUri.fsPath,
          oldUrisGroupedByBasename[getBasename(oldUri.fsPath)]
        );
        const newUriIsShortRef = isFirstUriInGroup(
          newUri.fsPath,
          newUrisGroupedByBasename[getBasename(newUri.fsPath)]
        );

        if (!oldShortRef || !newShortRef || !oldLongRef || !newLongRef) {
          return;
        }

        // therefound link to replace
        await Promise.all(
          newUris.map(async ({ fsPath }) => {
            if (!containsMarkdownExt(fsPath) || fsPath === oldUri.fsPath) {
              return;
            }
            let doc;
            try {
              doc = await workspace.openTextDocument(Uri.file(fsPath));
            } catch (err) {
              throw err;
            }
            let refs: { old: string; new: string }[] = [];
            if (!oldUriIsShortRef && !newUriIsShortRef) {
              // replace long ref with long ref
              // TODO: Consider finding previous short ref and make it pointing to the long ref
              refs = [{ old: oldLongRef, new: newLongRef }];
            } else if (!oldUriIsShortRef && newUriIsShortRef) {
              // replace long ref with short ref
              refs = [{ old: oldLongRef, new: newShortRef }];
            } else if (oldUriIsShortRef && !newUriIsShortRef) {
              // replace short ref with long ref
              // TODO: Consider finding new short ref and making long refs pointing to the new short ref
              refs = [{ old: oldShortRef, new: newLongRef }];
            } else {
              // replace short ref with short ref
              refs = [{ old: oldShortRef, new: newShortRef }];
            }

            const nextContent = replaceRefs({
              refs,
              document: doc,
              onMatch: () => addToPathsUpdated(fsPath),
              onReplace: incrementRefsCounter,
            });

            if (nextContent !== null) {
              fs.writeFileSync(fsPath, nextContent);
            }
          })
        );
        // finished renaming
      })
    );
    return {
      refsUpdated,
      pathsUpdated,
    };
  }
}
