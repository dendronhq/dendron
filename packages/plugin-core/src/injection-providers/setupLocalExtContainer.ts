import "reflect-metadata";
import { DVault, EngineEventEmitter } from "@dendronhq/common-all";
import { container } from "tsyringe";
import * as vscode from "vscode";
import { EngineAPIService } from "../services/EngineAPIService";
import { MetadataSvcTreeViewConfig } from "../views/node/treeview/MetadataSvcTreeViewConfig";
import { ITreeViewConfig } from "../views/common/treeview/ITreeViewConfig";

export async function setupLocalExtContainer(opts: {
  wsRoot: string;
  vaults: DVault[];
  engine: EngineAPIService;
}) {
  const { wsRoot, engine, vaults } = opts;
  container.register<EngineEventEmitter>("EngineEventEmitter", {
    useToken: "ReducedDEngine",
  });
  container.register("wsRoot", { useValue: vscode.Uri.file(wsRoot) });
  container.register("ReducedDEngine", { useValue: engine });
  container.register("vaults", { useValue: vaults });
  container.register<ITreeViewConfig>("ITreeViewConfig", {
    useClass: MetadataSvcTreeViewConfig,
  });
}
