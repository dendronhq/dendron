import * as vscode from "vscode";
// import { DENDRON_COMMANDS } from "../constants";
import {
  IReducedEngineAPIService,
  LookupQuickpickFactory,
  NoteMetadataStore,
  NoteStore,
  VSCodeFileStore,
} from "@dendronhq/plugin-common";
import { MockEngineAPIService } from "./test/helpers/MockEngineAPIService";
import {
  CONSTANTS,
  DNodeUtils,
  DVaultUriVariant,
  IntermediateDendronConfig,
  isNotUndefined,
  StrictConfigV5,
} from "@dendronhq/common-all";
import YAML from "js-yaml";
import _ from "lodash";
import { Uri, WorkspaceFolder } from "vscode";
import path from "path";
import { URI, Utils } from "vscode-uri";
import { DendronEngineV3Web } from "./engine/DendronEngineV3Web";
// import { TextDecoder } from "util";
// import { TextDecoder } from "util";
// import path from "path";
// import { DendronEngineV3Web } from "@dendronhq/plugin-common";
// import { DendronEngineV3Web } from "@dendronhq/engine-server";
// import { ShowHelpCommand } from "../commands/ShowHelp";
// import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
// import { Logger } from "../logger";
// import { DWorkspace } from "../workspacev2";

export async function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Hello World");

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((activeEditor) => {
      console.log("Inside callback");
      vscode.window.showInformationMessage(
        "Inside OnDidChangeActiveTextEditor"
      );
      console.log(`Scheme is ${activeEditor?.document.uri.scheme}`);
    })
  );

  const { workspaceFile, workspaceFolders } = vscode.workspace;

  if (workspaceFile) {
    console.log(path.normalize(workspaceFile.fsPath));
  }

  const wsRoot = await getWSRoot();

  console.log(`wsRoot is ${wsRoot?.fsPath}`);

  if (wsRoot) {
    const vaults = await getVaults(wsRoot);

    console.log(`vaults are ${vaults.length} in length`);
    // TODO: should just be wsRoot
    const engine = await getWebEngine(wsRoot.fsPath, vaults);

    const note = await engine.getNote("foo");
    console.log(`vaults are ${vaults.length} in length`);

    _setupCommands({ context, wsRoot: wsRoot.fsPath, vaults });
  }
}

export function deactivate() {
  // require("./_extension").deactivate(); // eslint-disable-line global-require
}

async function _setupCommands({
  context,
  wsRoot,
  vaults,
}: {
  wsRoot: string;
  context: vscode.ExtensionContext;
  vaults: DVaultUriVariant[];
}) {
  const existingCommands = await vscode.commands.getCommands();

  const key = "dendron.lookupNote";

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        const engine = await getWebEngine(wsRoot, vaults);

        // debugger;
        const factory = new LookupQuickpickFactory(
          engine,
          wsRoot,
          vaults.map((vault) => DNodeUtils.convertDVaultVersions(vault))
        );
        // const factory = new LookupQuickpickFactory(new MockEngineAPIService());
        factory.ShowLookup();
        // qp.show();
      })
    );
}

async function getWebEngine(
  wsRoot: string,
  vaults: DVaultUriVariant[]
): Promise<IReducedEngineAPIService> {
  const fileStore = new VSCodeFileStore();

  const engine = new DendronEngineV3Web({
    wsRoot,
    vaults,
    fileStore,
    noteStore: new NoteStore({
      fileStore,
      dataStore: new NoteMetadataStore(),
      wsRoot,
    }),
  });

  await engine.init();

  // const res = await engine.findNotes({ fname: "root.md" });
  return engine;
}

// function isInsidePath(outer: string, inner: string) {
//   // When going from `outer` to `inner`
//   const relPath = path.relative(outer, inner);
//   // If we have to leave `outer`, or if we have to switch to a
//   // different drive with an absolute path, then `inner` can't be
//   // inside `outer` (or `inner` and `outer` are identical)
//   return (
//     !relPath.startsWith("..") && !path.isAbsolute(relPath) && relPath !== ""
//   );
// }

// function uniqueOutermostFolders(folders: WorkspaceFolder[]) {
//   // Avoid duplicates
//   // folders = _.uniq(folders);
//   if (folders.length === 1) return folders;
//   return folders.filter((currentFolder) =>
//     folders.every((otherFolder) => {
//       // `currentFolder` is not inside any other folder
//       return !isInsidePath(otherFolder.uri.fsPath, currentFolder.uri.fsPath);
//     })
//   );
// }

// /**
//  * Go to dirname that {fname} is contained in, going in (deeper into tree) from base.
//  * @param maxLvl Default 3, how deep to go down in the file tree. Keep in mind that the tree gets wider and this search becomes exponentially more expensive the deeper we go.
//  * @param returnDirPath - return path to directory, default: false
//  *
//  * One warning: this will not search into folders starting with `.` to avoid searching through things like the `.git` folder.
//  */
// export async function findDownTo(opts: {
//   base: vscode.Uri;
//   fname: string;
//   maxLvl?: number;
//   returnDirPath?: boolean;
// }): Promise<vscode.Uri | undefined> {
//   const { fname, base, maxLvl, returnDirPath } = {
//     maxLvl: 3,
//     returnDirPath: false,
//     ...opts,
//   };
//   const contents = await vscode.workspace.fs.readDirectory(base);
//   let found = contents.filter((foundFile) => foundFile[0] === fname)[0];
//   if (found) {
//     found = path.join(base, found);
//     return returnDirPath ? path.dirname(found) : found;
//   }
//   if (maxLvl > 1) {
//     // Keep searching recursively
//     return (
//       await Promise.all(
//         contents.map(async (folder) => {
//           // Find the folders in the current folder
//           const subfolder = await fs.stat(path.join(base, folder));
//           if (!subfolder.isDirectory()) return;
//           // Exclude folders starting with . to skip stuff like `.git`
//           if (anymatch(COMMON_FOLDER_IGNORES, folder)) return;
//           return findDownTo({
//             ...opts,
//             base: path.join(base, folder),
//             maxLvl: maxLvl - 1,
//           });
//         })
//       )
//     ).filter(isNotUndefined)[0];
//   }
//   return undefined;
// }

export async function getWSRoot(): Promise<vscode.Uri | undefined> {
  const { workspaceFile, workspaceFolders } = vscode.workspace;

  if (workspaceFile) {
    return Promise.resolve(Utils.dirname(workspaceFile));
  }

  return;

  // if (!workspaceFolders) {
  //   //TODO: can still try using workspaceFile?
  //   return;
  // }

  // const folders = uniqueOutermostFolders(_.cloneDeep(workspaceFolders));

  // const dendronWorkspaceFolders = await Promise.all(
  //   folders.map((folder) =>
  //     findDownTo({
  //       base: folder,
  //       fname: CONSTANTS.DENDRON_CONFIG_FILE,
  //       returnDirPath: true,
  //     })
  //   )
  // );
  // return dendronWorkspaceFolders.filter(isNotUndefined);
}

// async function getOrPromptWsRoot({
//   ext,
// }: WorkspaceActivatorValidateOpts): Promise<string | undefined> {
//   if (ext.type === WorkspaceType.NATIVE) {
//     const workspaceFolders = await WorkspaceUtils.findWSRootsInWorkspaceFolders(
//       DendronExtension.workspaceFolders()!
//     );
//     if (!workspaceFolders) {
//       return;
//     }
//     const resp = await getOrPromptWSRoot(workspaceFolders);
//     if (!_.isString(resp)) {
//       return;
//     }
//     return resp;
//   } else {
//     return path.dirname(DendronExtension.workspaceFile().fsPath);
//   }
// }

async function readYAML(path: Uri, overwriteDuplicate?: boolean): Promise<any> {
  // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
  const textDecoder = new TextDecoder();
  const file = await vscode.workspace.fs.readFile(path);
  // file.
  const bar = textDecoder.decode(file);
  return YAML.load(bar, {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}

async function getVaults(wsRoot: Uri): Promise<DVaultUriVariant[]> {
  const configPath = Uri.joinPath(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
  const config = (await readYAML(
    configPath,
    true
  )) as IntermediateDendronConfig;

  return config.workspace.vaults.map((dVault) => {
    return { ...dVault, path: Utils.joinPath(wsRoot, dVault.fsPath) };
  });
}
