import { InMemoryNoteCacheFactory } from "@dendronhq/engine-server/lib/util/inMemoryNoteCache";
import { NoteProps } from "@dendronhq/common-all";

/** Create note prop with some sensible default (for tests only). */
function createNoteProp(opts: { id: string; fname?: string }): NoteProps {
  const id = opts.id;
  const fname = opts.fname ? opts.fname : `/tmp/filename-${id}`;

  return {
    id: id,
    title: `title-val-${id}`,
    vault: { fsPath: "vault-1" },
    type: "note",
    desc: "",
    links: [],
    anchors: {},
    fname: fname,
    updated: 1627283357535,
    created: 1627283357535,
    parent: null,
    children: [],
    body: `body-val-${id}`,
    data: {},
    contentHash: undefined,
    tags: ["tag-1", "tag-2"],
  };
}

describe("inMemoryNoteCache.spec.ts", () => {
  describe("getNotesByFileNameIgnoreCase tests:", () => {
    describe("GIVEN cache with valid note props", () => {
      /** Two notes that have file name that differs only by case. */
      const NOTE_1A = createNoteProp({
        id: "1a",
        fname: "/tmp/one",
      });
      const NOTE_1B = createNoteProp({
        id: "1b",
        fname: "/tmp/ONE",
      });

      /** Note that has a single file name matching */
      const NOTE_2 = createNoteProp({
        id: "2",
        fname: "/tmp/two",
      });

      const VALID_NOTES_1: NoteProps[] = [NOTE_1A, NOTE_1B, NOTE_2];

      const cache = InMemoryNoteCacheFactory.createCache(VALID_NOTES_1);

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
