import { DVault, Time } from "@dendronhq/common-all";
import { createFileWatcher } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  DEngineClient,
  getPortFilePath,
  openPortFile,
} from "@dendronhq/engine-server";
import fs, { FSWatcher } from "fs-extra";
import _ from "lodash";
import path from "path";
import vscode, { window } from "vscode";

export type DWorkspaceInitOpts = {
  onReady: ({}: { ws: DWorkspace }) => Promise<void>;
  numRetries?: number;
};

export class DWorkspace {
  public wsRoot: string;
  public vaults: DVault[];
  public _engine: DEngineClient | undefined;
  public port: number | undefined;
  public onReady?: ({ ws }: { ws: DWorkspace }) => Promise<void>;
  public serverPortWatcher?: FSWatcher;

  static _WS: DWorkspace | undefined;

  static getOrCreate(opts?: { force: boolean }) {
    let justInitialized = false;
    if (!this._WS || opts?.force) {
      this._WS = new DWorkspace();
      justInitialized = true;
    }
    return { justInitialized, ws: this._WS };
  }

  static workspaceFile = vscode.workspace.workspaceFile;

  static workspaceFolders = vscode.workspace.workspaceFolders;

  constructor() {
    const wsFile = DWorkspace.workspaceFile?.fsPath;
    if (_.isUndefined(wsFile)) {
      throw Error("wsFile is undefined");
    }
    const vaults = DWorkspace.workspaceFolders;
    if (_.isUndefined(vaults)) {
      throw Error("vaults is undefined");
    }
    this.wsRoot = path.dirname(wsFile);
    this.vaults = vaults.map((ent) => ({
      fsPath: ent.uri.fsPath,
    }));
  }

  async init(opts?: DWorkspaceInitOpts) {
    // init engine
    this.onReady = opts?.onReady;
    return this.createServerWatcher({ numRetries: opts?.numRetries });
  }

  async initEngine({ port }: { port: number }) {
    const { wsRoot, vaults } = this;
    const dendronEngine = DendronEngineClient.create({
      port,
      ws: wsRoot,
      vaults,
    });
    await dendronEngine.sync();
    this._engine = dendronEngine;
    return dendronEngine;
  }

  get engine(): DEngineClient {
    if (!this._engine) {
      throw Error("engine not set");
    }
    return this._engine;
  }

  async createServerWatcher(opts?: { numRetries?: number }) {
    const { wsRoot } = this;
    const fpath = getPortFilePath({ wsRoot });
    const { watcher } = await createFileWatcher({
      fpath,
      numTries: opts?.numRetries,
      onChange: async ({ fpath }) => {
        const port = openPortFile({ fpath });
        this.onChangePort({ port });
      },
      onCreate: async ({ fpath }) => {
        const port = openPortFile({ fpath });
        this.onChangePort({ port });
      },
    });
    const now = Time.now();
    setTimeout(async () => {
      // in case file was created before watcher was put on
      if (
        fs.existsSync(fpath) &&
        now.toMillis() -
          Time.DateTime.fromJSDate(fs.statSync(fpath).ctime).toMillis() <
          10e3
      ) {
        const fpath = getPortFilePath({ wsRoot });
        const port = openPortFile({ fpath });
        this.onChangePort({ port });
      }
    }, 1000);
    this.serverPortWatcher = watcher;
  }

  async onChangePort({ port }: { port: number }) {
    const portPrev = this.port;
    if (this.port !== port) {
      window.showInformationMessage(`port updated: ${port}`);
      this.port = port;
      await this.initEngine({ port });
    }
    if (_.isUndefined(portPrev) && this.onReady) {
      this.onReady({ ws: this });
    }
  }
}
