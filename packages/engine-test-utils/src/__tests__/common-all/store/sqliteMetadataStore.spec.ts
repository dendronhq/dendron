import { DVault, INoteStore, NoteStore, URI } from "@dendronhq/common-all";
import {
  NodeJSFileStore,
  SqliteDbFactory,
  SqliteMetadataStore,
} from "@dendronhq/engine-server";
import { runAllNoteStoreTests } from "../../../noteStore.common";

async function createNoteStoreUsingSqliteMetadataStore(
  wsRoot: string,
  vaults: DVault[]
): Promise<INoteStore<string>> {
  const fileStore = new NodeJSFileStore();

  const dbResult = await SqliteDbFactory.createInitializedDB(
    wsRoot,
    vaults,
    fileStore,
    // "/Users/jyeung/code/dendron/dendron/dendron.test4.db"
    ":memory:" // This special DB name tells sqlite to create the db in-memory
  );

  if (dbResult.isErr()) {
    throw dbResult.error;
  }

  const metadataStore = new SqliteMetadataStore(dbResult.value, vaults);

  return new NoteStore(fileStore, metadataStore, URI.file(wsRoot));
}

describe("GIVEN a NoteStore containing a SQLiteMetadataStore internally", () => {
  runAllNoteStoreTests(createNoteStoreUsingSqliteMetadataStore);
});
