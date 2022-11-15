import {
  FuseEngine,
  INoteStore,
  NoteMetadataStore,
  NoteStore,
  URI,
} from "@dendronhq/common-all";
import { NodeJSFileStore } from "@dendronhq/engine-server";
import { runAllNoteStoreTests } from "../../../noteStore.common";

function createNoteStoreUsingNoteMetadataStore(
  wsRoot: string
): Promise<INoteStore<string>> {
  return Promise.resolve(
    new NoteStore(
      new NodeJSFileStore(),
      new NoteMetadataStore(
        new FuseEngine({
          fuzzThreshold: 0.2,
        })
      ),
      URI.file(wsRoot)
    )
  );
}

describe("GIVEN a NoteStore containing a NoteMetadataStore internally", () => {
  runAllNoteStoreTests(createNoteStoreUsingNoteMetadataStore);
});
