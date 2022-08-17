import {
  DLogger,
  EngineEventEmitter,
  IDataStore,
  IFileStore,
  INoteStore,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
} from "@dendronhq/common-all";
import { container, Lifecycle } from "tsyringe";
import { PreviewProxy } from "../../components/views/PreviewProxy";
import { ILookupProvider } from "../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../engine/DendronEngineV3Web";
import { IReducedEngineAPIService } from "../engine/IReducedEngineApiService";
import { VSCodeFileStore } from "../engine/store/VSCodeFileStore";
import { PreviewPanel } from "../views/preview/PreviewPanel";
import { ITreeViewConfig } from "../views/treeView/ITreeViewConfig";
import { TreeViewDummyConfig } from "../views/treeView/TreeViewDummyConfig";
import { getVaults } from "./getVaults";
import { getWSRoot } from "./getWSRoot";
import * as vscode from "vscode";
import { URI } from "vscode-uri";
import { IPreviewLinkHandler } from "../../components/views/IPreviewLinkHandler";
import { DummyPreviewLinkHandler } from "../views/preview/DummyPreviewLinkHandler";
import { ITextDocumentService } from "../../services/ITextDocumentService";
import { ConsoleLogger } from "../utils/ConsoleLogger";
import { DummyTextDocumentService } from "../views/preview/DummyTextDocumentService";
import { getPort } from "./getPort";
import {
  DummyPreviewPanelConfig,
  IPreviewPanelConfig,
} from "../views/preview/IPreviewPanelConfig";

/**
 * This function prepares a TSyringe container suitable for the Web Extension
 * flavor of the Dendron Plugin.
 *
 * It uses a VSCodeFileStore and includes a reduced engine that runs in-memory.
 */
export async function setupWebExtContainer(context: vscode.ExtensionContext) {
  const wsRoot = await getWSRoot();

  if (!wsRoot) {
    throw new Error("Unable to find wsRoot!");
  }
  const vaults = await getVaults(wsRoot);

  // The EngineEventEmitter is also DendronEngineV3Web, so reuse the same token
  // to supply any emitter consumers. This ensures the same engine singleton
  // gets used everywhere.
  container.register<EngineEventEmitter>("EngineEventEmitter", {
    useToken: "IReducedEngineAPIService",
  });

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

  container.register<IDataStore<string, NotePropsMeta>>(
    "IDataStore",
    {
      useClass: NoteMetadataStore,
    },
    { lifecycle: Lifecycle.Singleton }
  );

  container.register("wsRoot", { useValue: wsRoot });
  container.register("vaults", { useValue: vaults });

  // TODO: Get rid of this in favor or using DI in Note Store / common-all package.
  const fs = container.resolve<IFileStore>("IFileStore");
  const ds = container.resolve<IDataStore<string, NotePropsMeta>>("IDataStore");

  const noteStore = new NoteStore(fs, ds, wsRoot);

  container.register<INoteStore<string>>("INoteStore", {
    useValue: noteStore,
  });

  container.register<ILookupProvider>("NoteProvider", {
    useClass: NoteLookupProvider,
  });

  container.afterResolution<DendronEngineV3Web>(
    "IReducedEngineAPIService",
    (_t, result) => {
      if ("init" in result) {
        result.init().then(
          () => {},
          (reason) => {
            throw new Error(`Dendron Engine Failed to Initialize: ${reason}`);
          }
        );
      }
    },
    { frequency: "Once" }
  );

  container.register<ITreeViewConfig>("ITreeViewConfig", {
    useClass: TreeViewDummyConfig,
  });

  container.register<PreviewProxy>("PreviewProxy", {
    useClass: PreviewPanel,
  });

  container.register<URI>("extensionUri", {
    useValue: context.extensionUri,
  });

  container.register<IPreviewLinkHandler>("IPreviewLinkHandler", {
    useClass: DummyPreviewLinkHandler, // TODO: Add a real one
  });

  container.register<IPreviewPanelConfig>("IPreviewPanelConfig", {
    useClass: DummyPreviewPanelConfig, // TODO: Add a real one
  });

  container.register<ITextDocumentService>("ITextDocumentService", {
    useClass: DummyTextDocumentService, // TODO: Add a real one
  });

  container.register<DLogger>("logger", {
    useClass: ConsoleLogger,
  });

  container.register<number>("port", {
    useValue: await getPort(wsRoot),
  });
}
