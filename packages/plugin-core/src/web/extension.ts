import {
  CONSTANTS,
  DVaultUriVariant,
  IDataStore,
  IFileStore,
  INoteStore,
  IntermediateDendronConfig,
  NotePropsMeta,
} from "@dendronhq/common-all";
import YAML from "js-yaml";
import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { Utils } from "vscode-uri";
import { ILookupProvider } from "./commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "./commands/lookup/NoteLookupProvider";
import { WebNoteLookupCmd } from "./commands/WebNoteLookupCmd";
import { DendronEngineV3Web } from "./engine/DendronEngineV3Web";
import { IReducedEngineAPIService } from "./engine/IReducedEngineApiService";
import { NoteMetadataStore } from "./engine/store/NoteMetadataStore";
import { NoteStore } from "./engine/store/NoteStore";
import { VSCodeFileStore } from "./engine/store/VSCodeFileStore";

export async function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Hello World");

  await setupWebExtensionInjectionContainer();

  setupCommands(context);

  vscode.commands.executeCommand("setContext", "dendron:pluginActive", true);
}

export function deactivate() {}

async function setupWebExtensionInjectionContainer() {
  const wsRoot = await getWSRoot();

  if (!wsRoot) {
    throw new Error("Unable to find wsRoot!");
  }
  const vaults = await getVaults(wsRoot);

  container.register<IReducedEngineAPIService>(
    "IReducedEngineAPIService",
    {
      useClass: DendronEngineV3Web,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register<IFileStore>("IFileStore", {
    useClass: VSCodeFileStore,
  });

  container.register<INoteStore<string>>(
    "INoteStore",
    {
      useClass: NoteStore,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register<IDataStore<string, NotePropsMeta>>(
    "IDataStore",
    {
      useClass: NoteMetadataStore,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register<ILookupProvider>("NoteProvider", {
    useClass: NoteLookupProvider,
  });

  container.afterResolution<DendronEngineV3Web>(
    "IReducedEngineAPIService",
    (_t, result) => {
      if ("init" in result) {
        console.log("Initializing Engine");
        result.init().then(
          (result) => {
            console.log("Finished Initializing Engine");
          },
          (reason) => {
            throw new Error("Failed Engine Init");
          }
        );
      }
    },
    { frequency: "Once" }
  );

  container.register("wsRoot", { useValue: wsRoot });
  container.register("wsRootString", { useValue: wsRoot.fsPath });
  container.register("vaults", { useValue: vaults });
}

async function setupCommands(context: vscode.ExtensionContext) {
  const existingCommands = await vscode.commands.getCommands();

  const key = "dendron.lookupNote";
  const cmd = container.resolve(WebNoteLookupCmd);

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        await cmd.run();
      })
    );
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
  // @ts-ignore
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
