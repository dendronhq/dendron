import {
  DendronError,
  DEngineClientV2,
  DVault,
  Time,
} from "@dendronhq/common-all";
import { createFileWatcher } from "@dendronhq/common-server";
import fs, { FSWatcher } from "fs-extra";
import _ from "lodash";
import { DendronEngineClient } from "../engineClient";
import {
  getPortFilePath,
  getWSMetaFilePath,
  openPortFile,
  openWSMetaFile,
} from "../utils";

export type EngineConnectorInitOpts = {
  onReady: ({}: { ws: EngineConnector }) => Promise<void>;
  numRetries?: number;
};

export class EngineConnector {
  public wsRoot: string;
  public vaults: DVault[];
  public _engine: DEngineClientV2 | undefined;
  public port: number | undefined;
  public onReady?: ({ ws }: { ws: EngineConnector }) => Promise<void>;
  public serverPortWatcher?: FSWatcher;
  public initialized: boolean;

  static _ENGINE_CONNECTOR: EngineConnector | undefined;

  static instance() {
    if (!this._ENGINE_CONNECTOR) {
      throw new DendronError({ msg: "no workspace" });
    }
    return this._ENGINE_CONNECTOR;
  }

  constructor({ wsRoot, vaults }: { wsRoot: string; vaults: DVault[] }) {
    this.wsRoot = wsRoot;
    this.vaults = vaults;
    EngineConnector._ENGINE_CONNECTOR = this;
    this.initialized = false;
  }

  async init(opts?: EngineConnectorInitOpts) {
    // init engine
    this.onReady = opts?.onReady;
    return this.createServerWatcher({ numRetries: opts?.numRetries });
  }

  async initEngine({ port }: { port: number }) {
    const { wsRoot, vaults } = this;
    const dendronEngine = DendronEngineClient.create({
      port,
      ws: wsRoot,
      vaults: vaults.map((ent) => ent.fsPath),
    });
    await dendronEngine.sync();
    this._engine = dendronEngine;
    return dendronEngine;
  }

  get engine(): DEngineClientV2 {
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
    // file should exist at this point
    const metaFpath = getWSMetaFilePath({ wsRoot });
    const wsMeta = openWSMetaFile({ fpath: metaFpath });
    const wsActivation = wsMeta.activationTime;

    // check if port was created after current ws
    const portCreated = Time.DateTime.fromJSDate(
      fs.statSync(fpath).ctime
    ).toMillis();
    if (portCreated > wsActivation) {
      const port = openPortFile({ fpath });
      this.onChangePort({ port });
    }
    // race condition were old workspace file is found
    setTimeout(() => {
      if (fs.existsSync(fpath)) {
        const port = openPortFile({ fpath });
        this.onChangePort({ port });
      }
    }, 10000);

    // attach watcher
    this.serverPortWatcher = watcher;
  }

  async onChangePort({ port }: { port: number }) {
    const portPrev = this.port;
    if (this.port !== port) {
      this.port = port;
      await this.initEngine({ port });
    }
    if (_.isUndefined(portPrev) && this.onReady) {
      this.onReady({ ws: this });
    }
    this.initialized = true;
  }
}
