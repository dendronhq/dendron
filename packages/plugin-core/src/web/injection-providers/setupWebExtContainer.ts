import {
  DLogger,
  EngineEventEmitter,
  getStage,
  IDataStore,
  IFileStore,
  INoteStore,
  IntermediateDendronConfig,
  NoteMetadataStore,
  NotePropsMeta,
  NoteStore,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import { container, Lifecycle } from "tsyringe";
import * as vscode from "vscode";
import { Event, EventEmitter, TextDocument, workspace } from "vscode";
import { URI } from "vscode-uri";
import { IPreviewLinkHandler } from "../../components/views/IPreviewLinkHandler";
import { PreviewProxy } from "../../components/views/PreviewProxy";
import { ITextDocumentService } from "../../services/ITextDocumentService";
import { TextDocumentService } from "../../services/web/TextDocumentService";
import { DummyTelemetryClient } from "../../telemetry/common/DummyTelemetryClient";
import { ITelemetryClient } from "../../telemetry/common/ITelemetryClient";
import { WebTelemetryClient } from "../../telemetry/web/WebTelemetryClient";
import { ITreeViewConfig } from "../../views/common/treeview/ITreeViewConfig";
import { TreeViewDummyConfig } from "../../views/common/treeview/TreeViewDummyConfig";
import { ILookupProvider } from "../commands/lookup/ILookupProvider";
import { NoteLookupProvider } from "../commands/lookup/NoteLookupProvider";
import { DendronEngineV3Web } from "../engine/DendronEngineV3Web";
import { INoteRenderer } from "../engine/INoteRenderer";
import { PluginNoteRenderer } from "../engine/PluginNoteRenderer";
import { VSCodeFileStore } from "../engine/store/VSCodeFileStore";
import { ConsoleLogger } from "../utils/ConsoleLogger";
import {
  DummyPreviewPanelConfig,
  IPreviewPanelConfig,
} from "../views/preview/IPreviewPanelConfig";
import { PreviewLinkHandler } from "../views/preview/PreviewLinkHandler";
import { PreviewPanel } from "../views/preview/PreviewPanel";
import { getAssetsPrefix } from "./getAssetsPrefix";
import { getEnablePrettlyLinks } from "./getEnablePrettlyLinks";
import { getSiteIndex } from "./getSiteIndex";
import { getSiteUrl } from "./getSiteUrl";
import { getVaults } from "./getVaults";
import { getWorkspaceConfig } from "./getWorkspaceConfig";
import { getWSRoot } from "./getWSRoot";

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
  const assetsPrefix = await getAssetsPrefix(wsRoot);
  const enablePrettyLinks = await getEnablePrettlyLinks(wsRoot);
  const siteUrl = await getSiteUrl(wsRoot);
  const siteIndex = await getSiteIndex(wsRoot);

  container.register<vscode.ExtensionContext>("extensionContext", {
    useValue: context,
  });

  // The EngineEventEmitter is also DendronEngineV3Web, so reuse the same token
  // to supply any emitter consumers. This ensures the same engine singleton
  // gets used everywhere.
  container.register<EngineEventEmitter>("EngineEventEmitter", {
    useToken: "ReducedDEngine",
  });

  container.register<ReducedDEngine>(
    "ReducedDEngine",
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
  container.register("assetsPrefix", { useValue: assetsPrefix });
  container.register("enablePrettyLinks", { useValue: enablePrettyLinks });
  container.register("siteUrl", { useValue: siteUrl });
  container.register("siteIndex", { useValue: siteIndex });

  container.register<INoteStore<string>>("INoteStore", {
    useFactory: (container) => {
      const fs = container.resolve<IFileStore>("IFileStore");
      const ds =
        container.resolve<IDataStore<string, NotePropsMeta>>("IDataStore");

      return new NoteStore(fs, ds, wsRoot);
    },
  });

  container.register<ILookupProvider>("NoteProvider", {
    useClass: NoteLookupProvider,
  });

  container.afterResolution<DendronEngineV3Web>(
    "ReducedDEngine",
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

  setupTelemetry();

  container.register<PreviewProxy>("PreviewProxy", {
    useClass: PreviewPanel,
  });

  container.register<URI>("extensionUri", {
    useValue: context.extensionUri,
  });

  container.register<IPreviewLinkHandler>("IPreviewLinkHandler", {
    useClass: PreviewLinkHandler,
  });

  container.register<IPreviewPanelConfig>("IPreviewPanelConfig", {
    useClass: DummyPreviewPanelConfig, // TODO: Add a real one
  });

  container.register<ITextDocumentService>("ITextDocumentService", {
    useClass: TextDocumentService,
  });

  container.register<Event<TextDocument>>("textDocumentEvent", {
    useValue: workspace.onDidSaveTextDocument,
  });

  container.register<DLogger>("logger", {
    useClass: ConsoleLogger,
  });

  // Just use a dummy number - this isn't actually used by the web logic, but
  // it's a dependency in some util methods.
  container.register<number>("port", {
    useValue: 1,
  });

  container.register<INoteRenderer>("INoteRenderer", {
    useClass: PluginNoteRenderer,
  });

  const config = await getWorkspaceConfig(wsRoot);
  container.register<IntermediateDendronConfig>("IntermediateDendronConfig", {
    useValue: config as IntermediateDendronConfig,
  });

  setupTabAutoComplete(context);
}

function setupTelemetry() {
  const stage = getStage();

  switch (stage) {
    case "prod": {
      container.register<ITelemetryClient>("ITelemetryClient", {
        useClass: WebTelemetryClient,
      });
      break;
    }
    default: {
      container.register<ITelemetryClient>("ITelemetryClient", {
        useClass: DummyTelemetryClient,
      });
      break;
    }
  }
}

function setupTabAutoComplete(context: vscode.ExtensionContext) {
  const emitter = new vscode.EventEmitter<void>();

  // Add to extension disposables for auto-cleanup:
  context.subscriptions.push(emitter);

  container.registerInstance<EventEmitter<void>>(
    "AutoCompleteEventEmitter",
    emitter
  );

  container.registerInstance<Event<void>>("AutoCompleteEvent", emitter.event);
}
