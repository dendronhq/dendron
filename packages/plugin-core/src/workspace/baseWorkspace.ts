import {
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  DWorkspaceV2,
  WorkspaceType,
  ConfigUtils,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/engine-server";
import * as vscode from "vscode";

export abstract class DendronBaseWorkspace implements DWorkspaceV2 {
  public wsRoot: string;
  public type = WorkspaceType.NATIVE;
  public logUri: vscode.Uri;
  public assetUri: vscode.Uri;
  protected _engine?: DEngineClient;

  constructor({
    wsRoot,
    logUri,
    assetUri,
  }: {
    wsRoot: string;
    logUri: vscode.Uri;
    assetUri: vscode.Uri;
  }) {
    this.wsRoot = wsRoot;
    this.logUri = logUri;
    this.assetUri = assetUri;
  }

  // TODO: optimize to not read every time
  get config(): IntermediateDendronConfig {
    return DConfig.getOrCreate(this.wsRoot);
  }

  // TODO: optimize to not read every time
  get vaults(): DVault[] {
    const vaults = ConfigUtils.getProp(
      this.config,
      "workspace.vaults"
    ) as DVault[];
    return vaults;
  }

  get engine(): DEngineClient {
    if (!this._engine) {
      throw new DendronError({ message: "no engiine set" });
    }
    return this._engine;
  }

  set engine(engine: DEngineClient) {
    this._engine = engine;
  }
}
