import {
  DendronConfig,
  DendronError,
  DEngineClientV2,
  DVault,
  Time,
} from "@dendronhq/common-all";
import { createFileWatcher, DLogger } from "@dendronhq/common-server";
import fs, { FSWatcher } from "fs-extra";
import _ from "lodash";
import { DConfig } from "../config";
import { DendronEngineClient } from "../engineClient";
import {
  getPortFilePath,
  getWSMetaFilePath,
  openPortFile,
  openWSMetaFile,
} from "../utils";

export type EngineConnectorInitOpts = {
  onReady?: ({}: { ws: EngineConnector }) => Promise<void>;
  numRetries?: number;
  portOverride?: number;
};

export class EngineConnector {
  public wsRoot: string;
  //public vaults: DVault[];
  public _engine: DEngineClientV2 | undefined;
  public port: number | undefined;
  public onReady?: ({ ws }: { ws: EngineConnector }) => Promise<void>;
  public serverPortWatcher?: FSWatcher;
  public initialized: boolean;
  public config: DendronConfig;
  public logger?: DLogger;

  static _ENGINE_CONNECTOR: EngineConnector | undefined;

  static instance() {
    if (!this._ENGINE_CONNECTOR) {
      throw new DendronError({ msg: "no workspace" });
    }
    return this._ENGINE_CONNECTOR;
  }

  static getOrCreate({ wsRoot, logger }: { wsRoot: string; logger?: DLogger }) {
    if (!this._ENGINE_CONNECTOR) {
      return new EngineConnector({ wsRoot, logger });
    }
    return this._ENGINE_CONNECTOR;
  }

  constructor({ wsRoot, logger }: { wsRoot: string; logger?: DLogger }) {
    this.wsRoot = wsRoot;
    this.logger = logger;
    this.config = DConfig.getOrCreate(wsRoot);
    EngineConnector._ENGINE_CONNECTOR = this;
    this.initialized = false;
  }

  get vaults(): DVault[] {
    return this.config.vaults;
  }

  async init(opts?: EngineConnectorInitOpts) {
    // init engine
    this.onReady = opts?.onReady;
    if (opts?.portOverride) {
      await this.initEngine({ port: opts.portOverride });
    } else {
      return this.createServerWatcher({ numRetries: opts?.numRetries });
    }
  }

  async initEngine({ port }: { port: number }) {
    const { wsRoot, vaults } = this;
    const dendronEngine = DendronEngineClient.create({
      port,
      ws: wsRoot,
      vaults: vaults.map((ent) => ent.fsPath),
      vaultsv4: vaults,
      logger: this.logger,
    });
    await dendronEngine.sync();
    this._engine = dendronEngine;
    this.initialized = true;
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
    const portFilePath = getPortFilePath({ wsRoot });

    // create file watcher to get port file
    const { watcher } = await createFileWatcher({
      fpath: portFilePath,
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

    // get time when port was created
    const portCreated = Time.DateTime.fromJSDate(
      fs.statSync(portFilePath).ctime
    ).toMillis();
    // if port is created after workspace activated, we have a good port file
    if (portCreated > wsActivation) {
      const port = openPortFile({ fpath: portFilePath });
      this.onChangePort({ port });
    }

    // race condition were old workspace file is found
    setTimeout(() => {
      if (fs.existsSync(portFilePath) && portCreated > wsActivation) {
        const port = openPortFile({ fpath: portFilePath });
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
