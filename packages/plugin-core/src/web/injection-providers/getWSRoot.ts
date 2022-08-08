import { CONSTANTS, isNotUndefined } from "@dendronhq/common-all";
import path from "path";
import * as vscode from "vscode";
import { WorkspaceFolder } from "vscode";
import { Utils } from "vscode-uri";
import anymatch from "anymatch";

/**
 * Gets the workspace root of the currently opened folder(s) or workspace in VS Code
 * @returns
 */
export async function getWSRoot(): Promise<vscode.Uri | undefined> {
  const { workspaceFile, workspaceFolders } = vscode.workspace;

  if (workspaceFile) {
    return Promise.resolve(Utils.dirname(workspaceFile));
  }

  if (workspaceFolders) {
    const folders = uniqueOutermostFolders(workspaceFolders.slice());

    const dendronWorkspaceFolders = await Promise.all(
      folders.map((folder) =>
        findDownTo({
          base: folder.uri,
          fname: CONSTANTS.DENDRON_CONFIG_FILE,
          returnDirPath: true,
        })
      )
    );
    const results = dendronWorkspaceFolders.filter(isNotUndefined);

    if (results.length <= 1) {
      return results[0];
    }

    const selectedRoot = await vscode.window.showQuickPick(
      results.map((result): vscode.QuickPickItem => {
        return {
          label: result.fsPath,
        };
      }),
      {
        ignoreFocusOut: true,
        canPickMany: false,
        title: "Select Dendron workspace to load",
      }
    );
    if (!selectedRoot) {
      await vscode.window.showInformationMessage(
        "You skipped loading any Dendron workspace, Dendron is not active. You can run the 'Developer: Reload Window' command to reactivate Dendron."
      );
      // Logger.info({
      //   msg: "User skipped loading a Dendron workspace",
      //   workspaceFolders,
      // });
      return;
    }
    return results.find((folder) => folder.fsPath === selectedRoot.label);
  }

  return;
}

function uniqueOutermostFolders(folders: WorkspaceFolder[]) {
  // Avoid duplicates
  // folders = _.uniq(folders);
  if (folders.length === 1) return folders;
  return folders.filter((currentFolder) =>
    folders.every((otherFolder) => {
      // `currentFolder` is not inside any other folder
      return !isInsidePath(otherFolder.uri.fsPath, currentFolder.uri.fsPath);
    })
  );
}

function isInsidePath(outer: string, inner: string) {
  // When going from `outer` to `inner`
  const relPath = path.relative(outer, inner);
  // If we have to leave `outer`, or if we have to switch to a
  // different drive with an absolute path, then `inner` can't be
  // inside `outer` (or `inner` and `outer` are identical)
  return (
    !relPath.startsWith("..") && !path.isAbsolute(relPath) && relPath !== ""
  );
}

/**
 * Go to dirname that {fname} is contained in, going in (deeper into tree) from base.
 * @param maxLvl Default 3, how deep to go down in the file tree. Keep in mind that the tree gets wider and this search becomes exponentially more expensive the deeper we go.
 * @param returnDirPath - return path to directory, default: false
 *
 * One warning: this will not search into folders starting with `.` to avoid searching through things like the `.git` folder.
 */
export async function findDownTo(opts: {
  base: vscode.Uri;
  fname: string;
  maxLvl?: number;
  returnDirPath?: boolean;
}): Promise<vscode.Uri | undefined> {
  const { fname, base, maxLvl, returnDirPath } = {
    maxLvl: 3,
    returnDirPath: false,
    ...opts,
  };
  const contents = await vscode.workspace.fs.readDirectory(base);
  const found = contents.filter((foundFile) => foundFile[0] === fname)[0];
  if (found) {
    const updatedPath = Utils.joinPath(base, found[0]);
    return returnDirPath ? Utils.dirname(updatedPath) : updatedPath;
  }
  if (maxLvl > 1) {
    // Keep searching recursively
    return (
      await Promise.all(
        contents.map(async (folder) => {
          // Find the folders in the current folder
          // TODO: Are 2 lines below safe to comment out?
          // const subfolder = await fs.stat(path.join(base.path, folder));
          // if (!subfolder.isDirectory()) return;
          // Exclude folders starting with . to skip stuff like `.git`
          if (anymatch(COMMON_FOLDER_IGNORES, folder)) return;
          return findDownTo({
            ...opts,
            base: Utils.joinPath(base, folder[0]),
            maxLvl: maxLvl - 1,
          });
        })
      )
    ).filter(isNotUndefined)[0];
  }
  return undefined;
}

// TODO: Migrate to common-all
const COMMON_FOLDER_IGNORES: string[] = [
  "**/.*/**", // Any folder starting with .
  "**/node_modules/**", // nodejs
  "**/.git/**", // git
  "**/__pycache__/**", // python
];
