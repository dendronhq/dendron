import {
  DEngineClient,
  DVault,
  INoteStore,
  NoteStore,
  URI,
} from "@dendronhq/common-all";
import {
  DendronEngineClient,
  NodeJSFileStore,
  SqliteDbFactory,
  SqliteMetadataStore,
} from "@dendronhq/engine-server";
import { runAllNoteStoreTestsForSqlite } from "../../../noteStore.common";

async function createNoteStoreUsingSqliteMetadataStore(
  wsRoot: string,
  vaults: DVault[],
  engine: DEngineClient
): Promise<INoteStore<string>> {
  const fileStore = new NodeJSFileStore();

  const dbResult = await SqliteDbFactory.createInitializedDB(
    wsRoot,
    vaults,
    fileStore,
    // "/Users/jyeung/code/dendron/dendron/dendron.test4.db"
    ":memory:", // This special DB name tells sqlite to create the db in-memory,
    (engine as DendronEngineClient).logger
  );

  if (dbResult.isErr()) {
    throw dbResult.error;
  }

  const metadataStore = new SqliteMetadataStore(dbResult.value, vaults);
  await metadataStore.initSchema(
    fileStore,
    wsRoot,
    (engine as DendronEngineClient).logger
  );

  return new NoteStore(fileStore, metadataStore, URI.file(wsRoot));
}

describe("GIVEN a NoteStore containing a SQLiteMetadataStore internally", () => {
  runAllNoteStoreTestsForSqlite(createNoteStoreUsingSqliteMetadataStore);
});
