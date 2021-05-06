import {
  ERROR_SEVERITY,
  NotePropsDict,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import {
  InitializePayload,
  WorkspaceInitRequest,
  WorkspaceSyncPayload,
  WorkspaceSyncRequest,
} from "@dendronhq/common-server";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { getLogger } from "../../core";
import { getWS, putWS } from "../../utils";

export class WorkspaceController {
  static singleton?: WorkspaceController;
  static instance() {
    if (!WorkspaceController.singleton) {
      WorkspaceController.singleton = new WorkspaceController();
    }
    return WorkspaceController.singleton;
  }

  async init({ uri }: WorkspaceInitRequest): Promise<InitializePayload> {
    let notes: NotePropsDict;
    let schemas: SchemaModuleDict;
    const ctx = "WorkspaceController:init";
    const logger = getLogger();
    logger.info({ ctx, msg: "enter", uri });
    const engine = DendronEngineV2.create({
      wsRoot: uri,
      logger,
    });
    const { error } = await engine.init();
    if (error && error.severity === ERROR_SEVERITY.FATAL) {
      logger.error({ ctx, msg: "fatal error initializing notes", error });
      return { error };
    }
    notes = engine.notes;
    schemas = engine.schemas;
    await putWS({ ws: uri, engine });
    logger.info({ ctx, msg: "finish init", uri });
    const payload: InitializePayload = {
      error,
      data: { notes, schemas },
    };
    return payload;
  }

  async sync({ ws }: WorkspaceSyncRequest): Promise<WorkspaceSyncPayload> {
    const engine = await getWS({ ws });
    const { notes, schemas } = engine;
    return {
      error: null,
      data: { notes, schemas },
    };
  }
}
