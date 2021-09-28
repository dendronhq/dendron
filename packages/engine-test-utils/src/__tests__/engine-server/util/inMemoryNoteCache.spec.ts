import { NoteProps } from "@dendronhq/common-all";
import { InMemoryNoteCache } from "@dendronhq/engine-server";
import {
  CreateNoteOptsV4,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";

/** Create note prop with some sensible default (for tests only). */
async function createNoteProp(opts: {
  id: string;
  fname: string;
}): Promise<NoteProps> {
  const createOpts: CreateNoteOptsV4 = {
    fname: opts.fname,
    props: {
      id: opts.id,
    },
    wsRoot: "/tmp/test-ws",
    vault: {
      fsPath: "vault-1",
    },
    noWrite: true,
  };
  return NoteTestUtilsV4.createNote(createOpts);
}

describe("inMemoryNoteCache.spec.ts", () => {
  describe("getNotesByFileNameIgnoreCase tests:", () => {
    describe("GIVEN cache with valid note props", () => {
      /** Two notes that have file name that differs only by case. */
      let NOTE_1A: NoteProps;
      let NOTE_1B: NoteProps;
      /** Note that has a single file name matching */
      let NOTE_2: NoteProps;
      /** List of all the notes in this test suite.  */
      let VALID_NOTES_1: NoteProps[];
      let cache: InMemoryNoteCache;

      beforeEach(async () => {
        NOTE_1A = await createNoteProp({
          id: "1a",
          fname: "/tmp/one",
        });
        NOTE_1B = await createNoteProp({
          id: "1b",
          fname: "/tmp/ONE",
        });

        NOTE_2 = await createNoteProp({
          id: "2",
          fname: "/tmp/two",
        });

        VALID_NOTES_1 = [NOTE_1A, NOTE_1B, NOTE_2];
        cache = new InMemoryNoteCache(VALID_NOTES_1);
      });

      it("WHEN calling for file name that has different cases in notes THEN get both", () => {
        const notes = cache.getNotesByFileNameIgnoreCase("/tmp/onE");

        expect(notes).toEqual([NOTE_1A, NOTE_1B]);
      });

      it("WHEN calling for file name that matches single note THEN get the note", () => {
        const notes = cache.getNotesByFileNameIgnoreCase("/tmp/TWO");
        expect(notes).toEqual([NOTE_2]);
      });

      it("WHEN calling for file name that does not exist THEN empty list", () => {
        const notes = cache.getNotesByFileNameIgnoreCase("/tmp/i-dont-exist");
        expect(notes.length).toEqual(0);
      });

      it("WHEN calling undefined file name THEN throw", () => {
        // @ts-ignore
        expect(() => cache.getNotesByFileNameIgnoreCase(undefined)).toThrow();
      });

      it("WHEN calling with empty file name THEN throw", () => {
        expect(() => cache.getNotesByFileNameIgnoreCase("")).toThrow();
      });
    });
  });
});
