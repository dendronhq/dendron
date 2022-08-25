import {
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  DWorkspaceV2,
  WorkspaceType,
  ConfigUtils,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { Logger } from "../logger";

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
    const { data, error } = DConfig.readConfigAndApplyLocalOverrideSync(
      this.wsRoot
    );
    if (error) {
      Logger.error({ error });
    }
    return data;
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
