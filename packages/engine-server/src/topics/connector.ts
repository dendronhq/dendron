import {
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  Time,
} from "@dendronhq/common-all";
import {
  createFileWatcher,
  createLogger,
  DLogger,
} from "@dendronhq/common-server";
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
  /**
   * Should initialize engine before sync?
   */
  init?: boolean;
};

export class EngineConnector {
  /**
   * Conencts to the {@link DendronEngine}
   *
   * @remarks
   * Before initiating a connection, {@link EngineConnector.init} needs to be called
   */
  public wsRoot: string;
  //public vaults: DVault[];
  public _engine: DEngineClient | undefined;
  public port: number | undefined;
  public onReady?: ({ ws }: { ws: EngineConnector }) => Promise<void>;
  public serverPortWatcher?: FSWatcher;
  public initialized: boolean;
  public config: IntermediateDendronConfig;
  public logger: DLogger;

  static _ENGINE_CONNECTOR: EngineConnector | undefined;

  static instance() {
    if (!this._ENGINE_CONNECTOR) {
      throw new DendronError({ message: "no workspace" });
    }
    return this._ENGINE_CONNECTOR;
  }

  static getOrCreate({
    wsRoot,
    logger,
    force,
  }: {
    wsRoot: string;
    logger?: DLogger;
    force?: boolean;
  }) {
    if (!this._ENGINE_CONNECTOR || force) {
      return new EngineConnector({ wsRoot, logger });
    }
    return this._ENGINE_CONNECTOR;
  }

  constructor({ wsRoot, logger }: { wsRoot: string; logger?: DLogger }) {
    this.wsRoot = wsRoot;
    this.logger = logger || createLogger("connector");
    this.config = DConfig.getOrCreate(wsRoot);
    EngineConnector._ENGINE_CONNECTOR = this;
    this.initialized = false;
  }

  get vaults(): DVault[] {
    const vaults = DConfig.getConfig({
      config: this.config,
      path: "workspace.vaults",
      required: true,
    }) as DVault[];
    return vaults;
  }

  /**
   * Connect with engine
   * @param opts
   * @returns
   */
  async init(opts?: EngineConnectorInitOpts) {
    const ctx = "EngineConnector:init";
    // init engine
    this.logger.info({ ctx, msg: "enter", opts });
    this.onReady = opts?.onReady;
    if (opts?.portOverride) {
      const engine = await this.tryToConnect({ port: opts.portOverride });
      if (!engine) {
        throw new DendronError({ message: "error connecting" });
      }
      await this.initEngine({
        engine,
        port: opts.portOverride,
        init: opts.init,
      });
    } else {
      return this.createServerWatcher({
        numRetries: opts?.numRetries,
        init: opts?.init,
      });
    }
  }

  async initEngine(opts: {
    engine: DendronEngineClient;
    port: number;
    init?: boolean;
  }) {
    const ctx = "EngineConnector:initEngine";
    const { engine, port, init } = opts;
    this.logger.info({ ctx, msg: "enter", port, init });
    this.port = port;

    if (init) {
      await engine.init();
    } else {
      await engine.sync();
    }
    this._engine = engine;
    this.initialized = true;
    return engine;
  }

  async tryToConnect({ port }: { port: number }) {
    const ctx = "EngineConnector:tryToConnect";
    this.logger.info({ ctx, port, msg: "enter" });
    const { wsRoot, vaults } = this;
    const dendronEngine = DendronEngineClient.create({
      port,
      ws: wsRoot,
      vaults,
      logger: this.logger,
    });
    const resp = await dendronEngine.info();
    if (!_.isUndefined(resp.error)) {
      this.logger.info({ ctx, msg: "can't connect", error: resp.error });
      return false;
    } else {
      this.logger.info({ ctx, msg: "connected", info: resp.data });
      return dendronEngine;
    }
  }

  get engine(): DEngineClient {
    if (!this._engine) {
      throw Error("engine not set");
    }
    return this._engine;
  }

  private async _connect(opts: {
    wsRoot: string;
  }): Promise<false | { engine: DendronEngineClient; port: number }> {
    const portFilePath = getPortFilePath(opts);
    const metaFpath = getWSMetaFilePath(opts);
    const ctx = "EngineConnector:_connect";

    const wsMeta = openWSMetaFile({ fpath: metaFpath });
    const wsActivation = wsMeta.activationTime;
    // get time when port was created
    const portCreated = Time.DateTime.fromJSDate(
      fs.statSync(portFilePath).ctime
    ).toMillis();
    this.logger.info({ ctx, portCreated, wsActivation });
    const port = openPortFile({ fpath: portFilePath });
    this.logger.info({ ctx, msg: "initFromExistingFile", port });
    const maybeEngine = await this.tryToConnect({ port });
    if (maybeEngine) {
      return { engine: maybeEngine, port };
    } else {
      return false;
    }
  }

  async connectAndInit(opts: { wsRoot: string; init?: boolean }) {
    const ctx = "EngineConnector:connectAndInit";
    return new Promise((resolve) => {
      setTimeout(async () => {
        const maybeEngine = await this._connect(opts);
        this.logger.info({ ctx, msg: "checking for engine" });
        if (maybeEngine) {
          this.logger.info({ ctx, msg: "found engine" });
          await this.initEngine({ ...maybeEngine, init: opts.init });
          await (!_.isUndefined(this.onReady) && this.onReady({ ws: this }));
          resolve(undefined);
        }
      }, 3000);
    });
  }

  async createServerWatcher(opts?: { numRetries?: number; init?: boolean }) {
    const ctx = "EngineConnector:createServerWatcher";
    const { wsRoot } = this;
    const portFilePath = getPortFilePath({ wsRoot });
    this.logger.info({ ctx, msg: "enter", opts });

    // try to connect to file
    while (!this.initialized) {
      await this.connectAndInit({ wsRoot, init: opts?.init });
    }

    // create file watcher in case file changes
    const { watcher } = await createFileWatcher({
      fpath: portFilePath,
      numTries: opts?.numRetries,
      onChange: async ({ fpath }) => {
        const port = openPortFile({ fpath });
        this.logger.info({ ctx, msg: "fileWatcher:onChange", port });
        this.onChangePort({ port });
      },
      onCreate: async ({ fpath }) => {
        const port = openPortFile({ fpath });
        this.logger.info({ ctx, msg: "fileWatcher:onCreate", port });
        this.onChangePort({ port });
      },
    });
    this.serverPortWatcher = watcher;
  }

  async onChangePort({ port }: { port: number }) {
    const ctx = "EngineConnector:onChangePort";
    const portPrev = this.port;
    this.logger.info({ ctx, port, portPrev });
    if (this.port !== port) {
      this.port = port;
      const maybeEngine = await this.tryToConnect({ port });
      if (maybeEngine) {
        this.initEngine({ engine: maybeEngine, port });
      } else {
        this.logger.info({ ctx, msg: "unable to connect" });
      }
    }
    if (_.isUndefined(portPrev) && this.onReady) {
      this.onReady({ ws: this });
    }
  }
}
