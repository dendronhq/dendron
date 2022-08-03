import {
  IDataStore,
  IFileStore,
  INoteStore,
  NotePropsMeta,
} from "@dendronhq/common-all";
import "reflect-metadata";
import { container, Lifecycle } from "tsyringe";
import * as vscode from "vscode";
import { ILookupProvider } from "./commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "./commands/lookup/NoteLookupProvider";
import { NoteLookupCmd } from "./commands/NoteLookupCmd";
import { DendronEngineV3Web } from "./engine/DendronEngineV3Web";
import { IReducedEngineAPIService } from "./engine/IReducedEngineApiService";
import { NoteMetadataStore } from "./engine/store/NoteMetadataStore";
import { NoteStore } from "./engine/store/NoteStore";
import { VSCodeFileStore } from "./engine/store/VSCodeFileStore";
import { getVaults } from "./injection-providers/getVaults";
import { getWSRoot } from "./injection-providers/getWSRoot";

export async function activate(context: vscode.ExtensionContext) {
  await setupWebExtensionInjectionContainer();

  setupCommands(context);

  vscode.commands.executeCommand("setContext", "dendron:pluginActive", true);
  vscode.window.showInformationMessage("Dendron is active");
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
  const cmd = container.resolve(NoteLookupCmd);

  if (!existingCommands.includes(key))
    context.subscriptions.push(
      vscode.commands.registerCommand(key, async (_args: any) => {
        await cmd.run();
      })
    );
}
