import {
  ERROR_CODES,
  NotePropsDictV2,
  SchemaModuleDictV2,
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

  async init({ uri, config }: WorkspaceInitRequest) {
    let notes: NotePropsDictV2;
    let schemas: SchemaModuleDictV2;
    const { vaults } = config;
    const logger = getLogger();
    const engine = DendronEngineV2.create({ vaults, logger });
    const { error } = await engine.init();
    if (error && error.code !== ERROR_CODES.MINOR) {
      error.friendly = "error initializing notes";
      return { error };
    }
    notes = engine.notes;
    schemas = engine.schemas;
    await putWS({ ws: uri, engine });
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
