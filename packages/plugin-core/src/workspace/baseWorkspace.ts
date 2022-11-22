import {
  ConfigUtils,
  DendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  DWorkspaceV2,
  WorkspaceType,
} from "@dendronhq/common-all";
import * as vscode from "vscode";

export abstract class DendronBaseWorkspace implements DWorkspaceV2 {
  public wsRoot: string;
  public type = WorkspaceType.NATIVE;
  public logUri: vscode.Uri;
  public assetUri: vscode.Uri;
  protected _config: DendronConfig;
  protected _engine?: DEngineClient;

  constructor({
    wsRoot,
    logUri,
    assetUri,
    config,
  }: {
    wsRoot: string;
    logUri: vscode.Uri;
    assetUri: vscode.Uri;
    config: DendronConfig;
  }) {
    this.wsRoot = wsRoot;
    this.logUri = logUri;
    this.assetUri = assetUri;
    this._config = config;
  }

  get config(): DendronConfig {
    return this._config;
  }

  // TODO: optimize to not read every time
  get vaults(): DVault[] {
    return ConfigUtils.getVaults(this.config);
  }

  get engine(): DEngineClient {
    if (!this._engine) {
      throw new DendronError({ message: "no engine set" });
    }
    return this._engine;
  }

  set engine(engine: DEngineClient) {
    this._engine = engine;
  }
}
