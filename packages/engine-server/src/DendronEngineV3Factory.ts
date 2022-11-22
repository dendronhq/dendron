import {
  ConfigUtils,
  CONSTANTS,
  DLogger,
  FuseEngine,
  NoteStore,
  SchemaMetadataStore,
  SchemaStore,
  stringifyError,
} from "@dendronhq/common-all";
import { createLogger, DConfig } from "@dendronhq/common-server";
import path from "path";
import { URI } from "vscode-uri";
import { DendronEngineV3 } from "./DendronEngineV3";
import { SqliteDbFactory, SqliteMetadataStore } from "./drivers/sqlite";
import { NodeJSFileStore } from "./store";

/**
 * Temp class containing factory methods for DendronEngineV3. This can later be
 * replaced with t-syringe injection.
 */
export class DendronEngineV3Factory {
  /**
   * Creates an engine that is configured to use Sqlite as the metadata store.
   * @param param0
   * @returns
   */
  static async createWithSqliteStore({
    wsRoot,
    logger,
  }: {
    logger?: DLogger;
    wsRoot: string;
  }): Promise<DendronEngineV3> {
    const LOGGER = logger || createLogger();
    const { error, data: config } =
      DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
    if (error) {
      LOGGER.error(stringifyError(error));
    }

    const fileStore = new NodeJSFileStore();

    // FuseEngine is still used for handling schemas for now
    const fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(config).note.fuzzThreshold,
    });

    const vaults = ConfigUtils.getVaults(config);

    const dbFilePath = path.join(wsRoot, CONSTANTS.DENDRON_DB_FILE);

    const dbResult = await SqliteDbFactory.createInitializedDB(
      wsRoot,
      ConfigUtils.getVaults(config),
      fileStore,
      dbFilePath
    );

    if (dbResult.isErr()) {
      logger?.error(`Error in createWithSqliteStore: ${dbResult.error}`);
      throw dbResult.error;
    }

    const sqliteMetadataStore = new SqliteMetadataStore(dbResult.value, vaults);

    return new DendronEngineV3({
      wsRoot,
      vaults: ConfigUtils.getVaults(config),
      noteStore: new NoteStore(
        fileStore,
        sqliteMetadataStore,
        URI.file(wsRoot)
      ),
      schemaStore: new SchemaStore(
        fileStore,
        new SchemaMetadataStore(fuseEngine),
        URI.parse(wsRoot)
      ),
      fileStore,
      logger: LOGGER,
      config,
    });
  }
}
