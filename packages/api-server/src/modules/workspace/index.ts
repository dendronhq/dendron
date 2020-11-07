import {
  createLogger,
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
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
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
    const logger = createLogger("api-server");
    const { vaults } = config;
    const engine = new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({ vaults, logger }),
      mode: "fuzzy",
      logger,
    });
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
