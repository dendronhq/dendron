import { Note, DNodeUtils } from "@dendronhq/common-all";
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
import { BasicCommand } from "./base";

type CommandInput = {
  dest: string;
  preview: boolean;
};
type CommandOpts = {};
type CommandOutput = void;

// Short ref allowed when non-unique filename comes first in the list of sorted uris.
// /a.md - <-- can be referenced via short ref as [[a]], since it comes first according to paths sorting
// /folder1/a.md - can be referenced only via long ref as [[folder1/a]]
// /folder2/subfolder1/a.md - can be referenced only via long ref as [[folder2/subfolder1/a]]
const isFirstUriInGroup = (pathParam: string, urisGroup: Uri[] = []) =>
  urisGroup.findIndex((uriParam) => uriParam.fsPath === pathParam) === 0;
const getBasename = (pathParam: string) =>
  path.basename(pathParam).toLowerCase();

export class RenameNoteV2Command extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
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
      preview: false,
    };
  }

  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async execute(opts: CommandInput) {
    await cacheUris();
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const ws = DendronWorkspace.instance();
    let newNote = _.find(_.values(ws.engine.notes), { fname: opts.dest });
    if (newNote) {
      throw Error(`${opts.dest} already exists`);
      return;
    }
    const oldUri: Uri = editor.document.uri;

    newNote = new Note({ fname: opts.dest });
    const newUri = Uri.file(
      path.join(ws.rootWorkspace.uri.fsPath, opts.dest + ".md")
    );

    const noteOld = DNodeUtils.getNoteByFname(
      DNodeUtils.uri2Fname(oldUri),
      ws.engine,
      { throwIfEmpty: true }
    ) as Note;
    await ws.engine.delete(noteOld.id, "note", { metaOnly: true });
    fs.moveSync(oldUri.fsPath, newUri.fsPath);

    const files = [{ oldUri, newUri }];
    const oldFsPaths = files.map(({ oldUri }) => oldUri.fsPath);
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
    const newFsPaths = files.map(({ newUri }) => newUri.fsPath);
    const allUris = [
      ...getWorkspaceCache().allUris.filter(
        (uri) => !newFsPaths.includes(uri.fsPath)
      ),
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

    await Promise.all(
      files.map(async ({ oldUri, newUri }) => {
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

        await Promise.all(
          newUris.map(async ({ fsPath }) => {
            if (!containsMarkdownExt(fsPath)) {
              return;
            }
            const doc = await workspace.openTextDocument(Uri.file(fsPath));
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
      })
    );
    if (pathsUpdated.length > 0) {
      window.showInformationMessage(
        `Dendron updated ${refsUpdated} link${
          refsUpdated === 0 || refsUpdated === 1 ? "" : "s"
        } in ${pathsUpdated.length} file${
          pathsUpdated.length === 0 || pathsUpdated.length === 1 ? "" : "s"
        }`
      );
    }
    return;
  }
}
