import "reflect-metadata";
import {
  DendronConfig,
  DLogger,
  DVault,
  EngineEventEmitter,
  URI,
} from "@dendronhq/common-all";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { EngineAPIService } from "../services/EngineAPIService";
import { MetadataSvcTreeViewConfig } from "../views/node/treeview/MetadataSvcTreeViewConfig";
import { ITreeViewConfig } from "../views/common/treeview/ITreeViewConfig";
import { PreviewProxy } from "../components/views/PreviewProxy";
import { PreviewPanel } from "../views/common/preview/PreviewPanel";
import { IPreviewLinkHandler } from "../components/views/IPreviewLinkHandler";
import { PreviewLinkHandler } from "../components/views/PreviewLinkHandler";
import { ITextDocumentService } from "../services/ITextDocumentService";
import { TextDocumentService } from "../services/node/TextDocumentService";
import { ConsoleLogger } from "../web/utils/ConsoleLogger";

export async function setupLocalExtContainer(opts: {
  wsRoot: string;
  vaults: DVault[];
  engine: EngineAPIService;
  config: DendronConfig;
  context: vscode.ExtensionContext;
}) {
  const { wsRoot, engine, vaults, config, context } = opts;
  container.register<EngineEventEmitter>("EngineEventEmitter", {
    useToken: "ReducedDEngine",
  });
  container.register("wsRoot", { useValue: vscode.Uri.file(wsRoot) });
  container.register("ReducedDEngine", { useValue: engine });
  container.register("vaults", { useValue: vaults });
  container.register<ITreeViewConfig>("ITreeViewConfig", {
    useClass: MetadataSvcTreeViewConfig,
  });
  container.register<DendronConfig>("DendronConfig", {
    useValue: config,
  });
  container.register<IPreviewLinkHandler>("IPreviewLinkHandler", {
    useClass: PreviewLinkHandler,
  });
  container.register<ITextDocumentService>("ITextDocumentService", {
    useClass: TextDocumentService,
  });

  container.register<DLogger>("logger", {
    useClass: ConsoleLogger,
  });
  container.register<vscode.Event<vscode.TextDocument>>("textDocumentEvent", {
    useValue: vscode.workspace.onDidSaveTextDocument,
  });
  container.register<PreviewProxy>("PreviewProxy", {
    useClass: PreviewPanel,
  });
  container.register<number>("port", {
    useValue: 1,
  });
  container.register<URI>("extensionUri", {
    useValue: context.extensionUri,
  });
}
