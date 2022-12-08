import {
  ConfigService,
  DEngineInitPayload,
  DEngineInitResp,
  error2PlainObject,
  ERROR_SEVERITY,
  NoteDictsUtils,
  URI,
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import {
  DendronEngineV2,
  DendronEngineV3,
  DendronEngineV3Factory,
  NodeJSFileStore,
} from "@dendronhq/engine-server";
import { getLogger } from "../../core";
import { getWSEngine, putWS } from "../../utils";
import { DConfig, getDurationMilliseconds } from "@dendronhq/common-server";
import { homedir } from "os";

export class WorkspaceController {
  static singleton?: WorkspaceController;
  static instance() {
    if (!WorkspaceController.singleton) {
      WorkspaceController.singleton = new WorkspaceController();
    }
    return WorkspaceController.singleton;
  }

  async init({ uri }: WorkspaceInitRequest): Promise<DEngineInitResp> {
    const start = process.hrtime();

    const ctx = "WorkspaceController:init";
    const logger = getLogger();
    logger.info({ ctx, msg: "enter", uri });
    ConfigService.instance({
      homeDir: URI.file(homedir()),
      fileStore: new NodeJSFileStore(),
    });
    // until we roll out engine v3 as default, we can't remove this line.
    // TODO: remove once `enableEngineV3` is deprecated.
    const config = DConfig.readConfigSync(uri);
    let engine;
    if (config.dev?.enableEngineV3) {
      if (config.dev?.useSqlite) {
        engine = await DendronEngineV3Factory.createWithSqliteStore({
          wsRoot: uri,
          logger,
        });
      } else {
        engine = await DendronEngineV3.create({
          wsRoot: uri,
          logger,
        });
      }
    } else {
      engine = DendronEngineV2.create({
        wsRoot: uri,
        logger,
      });
    }

    // TODO: SQLite doesn't need to do engine.init(), apart from schema setup
    // (which currently doesn't work if Sqlite is enabled)
    if (config.dev?.enableEngineV3 && config.dev?.useSqlite) {
      await putWS({ ws: uri, engine });
      return {} as DEngineInitResp;
    } else {
      const { data, error } = await engine.init();
      if (error && error.severity === ERROR_SEVERITY.FATAL) {
        logger.error({ ctx, msg: "fatal error initializing notes", error });
        return { data, error };
      }
      await putWS({ ws: uri, engine });
      const duration = getDurationMilliseconds(start);
      logger.info({ ctx, msg: "finish init", duration, uri, error });
      let error2;
      if (error) {
        error2 = error2PlainObject(error);
      }
      const payload = {
        error: error2,
        data,
      };
      return payload;
    }
  }

  async sync({ ws }: WorkspaceSyncRequest): Promise<DEngineInitResp> {
    const engine = await getWSEngine({ ws });
    const notes = await engine.findNotes({ excludeStub: false });
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(engine.wsRoot)
    );
    const data = {
      notes: NoteDictsUtils.createNotePropsByIdDict(notes),
      vaults: engine.vaults,
      wsRoot: engine.wsRoot,
    } as DEngineInitPayload;
    if (configReadResult.isErr()) {
      return {
        data,
        error: configReadResult.error,
      };
    }
    data.config = configReadResult.value;

    return {
      data,
    };
  }
}
