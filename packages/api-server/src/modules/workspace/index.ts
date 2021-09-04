import {
  error2PlainObject,
  ERROR_SEVERITY,
  NotePropsDict,
  SchemaModuleDict,
  InitializePayload,
  WorkspaceInitRequest,
  WorkspaceSyncPayload,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { getLogger } from "../../core";
import { getWSEngine, putWS } from "../../utils";
import { getDurationMilliseconds } from "@dendronhq/common-server";

export class WorkspaceController {
  static singleton?: WorkspaceController;
  static instance() {
    if (!WorkspaceController.singleton) {
      WorkspaceController.singleton = new WorkspaceController();
    }
    return WorkspaceController.singleton;
  }

  async init({ uri }: WorkspaceInitRequest): Promise<InitializePayload> {
    const start = process.hrtime();

    let notes: NotePropsDict;
    let schemas: SchemaModuleDict;
    const ctx = "WorkspaceController:init";
    const logger = getLogger();
    logger.info({ ctx, msg: "enter", uri });
    const engine = DendronEngineV2.create({
      wsRoot: uri,
      logger,
    });
    let { error } = await engine.init();
    if (error && error.severity === ERROR_SEVERITY.FATAL) {
      logger.error({ ctx, msg: "fatal error initializing notes", error });
      return { error };
    }
    notes = engine.notes;
    schemas = engine.schemas;
    await putWS({ ws: uri, engine });
    const duration = getDurationMilliseconds(start);
    logger.info({ ctx, msg: "finish init", duration, uri, error });
    if (error) {
      error = error2PlainObject(error);
    }
    const payload: InitializePayload = {
      error,
      data: {
        notes,
        schemas,
        config: engine.config,
        vaults: engine.vaults,
        wsRoot: engine.wsRoot,
      },
    };
    return payload;
  }

  async sync({ ws }: WorkspaceSyncRequest): Promise<WorkspaceSyncPayload> {
    const engine = await getWSEngine({ ws });
    const { notes, schemas } = engine;
    return {
      error: null,
      data: {
        notes,
        schemas,
        config: engine.config,
        vaults: engine.vaults,
        wsRoot: engine.wsRoot,
      },
    };
  }
}
