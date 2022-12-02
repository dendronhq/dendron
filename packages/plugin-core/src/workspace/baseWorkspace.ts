import {
  ConfigService,
  DendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  DWorkspaceV2,
  URI,
  WorkspaceType,
} from "@dendronhq/common-all";
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

  get config(): PromiseLike<DendronConfig> {
    return ConfigService.instance()
      .readConfig(URI.file(this.wsRoot))
      .then((res) => {
        if (res.isErr()) {
          throw res.error;
        }
        return res.value;
      });
  }

  // TODO: optimize to not read every time
  get vaults(): PromiseLike<DVault[]> {
    return this.config.then((config) => config.workspace.vaults);
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
