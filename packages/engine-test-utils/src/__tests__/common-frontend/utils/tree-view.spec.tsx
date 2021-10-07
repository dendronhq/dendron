import { TreeViewUtils } from "@dendronhq/common-frontend";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

describe("GIVEN tree-view", () => {
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
          preSetupHook: async ({ wsRoot, vaults }) => {
            const vault = vaults[0];
            NoteTestUtilsV4.createNote({ fname: "foo", vault, wsRoot });
            NoteTestUtilsV4.createNote({ fname: "foo.10", vault, wsRoot });
            NoteTestUtilsV4.createNote({ fname: "foo.12", vault, wsRoot });
            NoteTestUtilsV4.createNote({ fname: "foo.11", vault, wsRoot });
          },
          createEngine: createEngineFromServer,
        }
      );
    });
  });
});
