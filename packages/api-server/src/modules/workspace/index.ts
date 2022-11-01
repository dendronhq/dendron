import {
  DEngineInitResp,
  NoteDictsUtils,
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { DendronEngineV3 } from "@dendronhq/engine-server";
import { getLogger } from "../../core";
import { getWSEngine, putWS } from "../../utils";

export class WorkspaceController {
  static singleton?: WorkspaceController;
  static instance() {
    if (!WorkspaceController.singleton) {
      WorkspaceController.singleton = new WorkspaceController();
    }
    return WorkspaceController.singleton;
  }

  async init({ uri }: WorkspaceInitRequest): Promise<DEngineInitResp> {
    // const start = process.hrtime();

    const ctx = "WorkspaceController:init";
    const logger = getLogger();
    logger.info({ ctx, msg: "enter", uri });

    // const config = DConfig.readConfigSync(uri);
    // let engine;
    // if (config.dev?.enableEngineV3) {
    //   engine = DendronEngineV3.create({
    //     wsRoot: uri,
    //     logger,
    //   });
    // } else {
    // engine = DendronEngineV2.create({
    //   wsRoot: uri,
    //   logger,
    // });

    const engine = await DendronEngineV3.create2({
      wsRoot: uri,
      logger,
    });
    // }

    await putWS({ ws: uri, engine });
    // const duration = getDurationMilliseconds(start);
    // logger.info({ ctx, msg: "finish init", duration, uri, error });
    // let error2;
    // if (error) {
    //   error2 = error2PlainObject(error);
    // }
    // const payload = {
    //   error: error2,
    //   data,
    // };

    // const payload = {
    //   data: { notes: [] },
    // };

    return {} as DEngineInitResp;
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
