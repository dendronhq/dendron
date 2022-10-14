import {
  DEngineInitResp,
  error2PlainObject,
  ERROR_SEVERITY,
  NoteDictsUtils,
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { getLogger } from "../../core";
import { getWSEngine, putWS } from "../../utils";
import { DConfig, getDurationMilliseconds } from "@dendronhq/common-server";

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
    const engine = DendronEngineV2.create({
      wsRoot: uri,
      logger,
    });
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

  async sync({ ws }: WorkspaceSyncRequest): Promise<DEngineInitResp> {
    const engine = await getWSEngine({ ws });
    const notes = await engine.findNotes({ excludeStub: false });
    return {
      data: {
        notes: NoteDictsUtils.createNotePropsByIdDict(notes),
        config: DConfig.readConfigSync(engine.wsRoot),
        vaults: engine.vaults,
        wsRoot: engine.wsRoot,
      },
    };
  }
}
