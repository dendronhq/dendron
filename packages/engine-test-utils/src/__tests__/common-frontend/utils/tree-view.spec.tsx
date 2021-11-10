import { TreeViewUtils } from "@dendronhq/common-frontend";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { WorkspaceOpts } from "@dendronhq/common-all";

const createTestNotes = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const vault = vaults[0];
  return Promise.all([
    NoteTestUtilsV4.createNote({ fname: "foo", vault, wsRoot }),
    NoteTestUtilsV4.createNote({ fname: "foo.10", vault, wsRoot }),
    NoteTestUtilsV4.createNote({ fname: "foo.12", vault, wsRoot }),
    NoteTestUtilsV4.createNote({ fname: "foo.11", vault, wsRoot }),
  ]);
};

describe("GIVEN tree-view", () => {
  describe("WHEN nav_order is reversed", () => {
    test("THEN tree-view respects reversed nav_order", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const tree = TreeViewUtils.note2TreeDatanote({
            noteId: "foo",
            noteDict: engine.notes,
            applyNavExclude: false,
          });
          expect(tree?.children).toBeDefined();
          expect(tree!.children!.length).toEqual(3);
          expect(tree!.children![0].title).toEqual("12");
          expect(tree!.children![1].title).toEqual("11");
          expect(tree!.children![2].title).toEqual("10");
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            const vault = vaults[0];
            await createTestNotes({ wsRoot, vaults });
            await NoteTestUtilsV4.modifyNoteByPath(
              { wsRoot, vault, fname: "foo" },
              (note) => {
                note.custom = { sort_order: "reverse" };
                return note;
              }
            );
          },
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN nav_order is set", () => {
    test("THEN tree-view respects nav_order", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const tree = TreeViewUtils.note2TreeDatanote({
            noteId: "foo",
            noteDict: engine.notes,
            applyNavExclude: false,
          });
          expect(tree?.children).toBeDefined();
          expect(tree!.children!.length).toEqual(3);
          expect(tree!.children![0].title).toEqual("12");
          expect(tree!.children![1].title).toEqual("10");
          expect(tree!.children![2].title).toEqual("11");
        },
        {
          expect,
          preSetupHook: async ({ wsRoot, vaults }) => {
            await createTestNotes({ wsRoot, vaults });
            const vault = vaults[0];
            await NoteTestUtilsV4.modifyNoteByPath(
              { fname: "foo.10", wsRoot, vault },
              (note) => {
                note.custom.nav_order = 3;
                return note;
              }
            );
            await NoteTestUtilsV4.modifyNoteByPath(
              { fname: "foo.12", wsRoot, vault },
              (note) => {
                note.custom.nav_order = 1;
                return note;
              }
            );
          },
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN notes are created out-of-order", () => {
    test("THEN tree-view sorts them based on titles", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const tree = TreeViewUtils.note2TreeDatanote({
            noteId: "foo",
            noteDict: engine.notes,
            applyNavExclude: false,
          });
          expect(tree?.children).toBeDefined();
          expect(tree!.children!.length).toEqual(3);
          expect(tree!.children![0].title).toEqual("10");
          expect(tree!.children![1].title).toEqual("11");
          expect(tree!.children![2].title).toEqual("12");
        },
        {
          expect,
          preSetupHook: async (opts) => {
            return createTestNotes(opts);
          },
          createEngine: createEngineFromServer,
        }
      );
    });
  });
});
