import { APIUtils } from "@dendronhq/common-all";
import { combinedStore, engineSlice } from "@dendronhq/common-frontend";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { createEngineFromServer, runEngineTestV5 } from "../../../../engine";
import { ENGINE_HOOKS } from "../../../../presets";

describe("GIVEN syncNote", () => {
  afterEach(() => {
    combinedStore.dispatch(engineSlice.tearDown());
  });

  describe("WHEN sync new note", () => {
    test("THEN note is added to parent", async () => {
      await runEngineTestV5(
        async ({ port, wsRoot, engine, vaults }) => {
          // --- setup
          // add a new note to the engine
          const newNote = await NoteTestUtilsV4.createNote({
            fname: "foo.newchild",
            vault: vaults[0],
            wsRoot,
            props: {
              parent: "foo",
              contentHash: undefined,
            },
          });
          await engine.writeNote(newNote, { metaOnly: true });
          expect(port).toBeTruthy();
          const url = APIUtils.getLocalEndpoint(port!);

          // --- setup engineSlice
          // sync new note to redux engine
          const initNotesOpts = { ws: wsRoot, url };
          await combinedStore.dispatch(engineSlice.initNotes(initNotesOpts));
          await combinedStore.dispatch(
            engineSlice.syncNote({ ...initNotesOpts, note: newNote })
          );

          // check results
          const engineSliceNotes = combinedStore.getState().engine.notes;
          // new note exists
          expect(engineSliceNotes[newNote.fname]).toEqual(newNote);
          // new note is child of foo
          expect(engineSliceNotes["foo"].children).toEqual([
            "foo.ch1",
            "foo.newchild",
          ]);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });

  describe("WHEN sync existing note", () => {
    test("THEN note is retrieved", async () => {
      await runEngineTestV5(
        async ({ port, wsRoot, engine }) => {
          const note = engine.notes["foo"];
          expect(port).toBeTruthy();
          const url = APIUtils.getLocalEndpoint(port!);

          const initNotesOpts = { ws: wsRoot, url };
          await combinedStore.dispatch(engineSlice.initNotes(initNotesOpts));
          await combinedStore.dispatch(
            engineSlice.syncNote({ ...initNotesOpts, note })
          );
          const notesDict = combinedStore.getState().engine.notes;
          expect(notesDict["foo"]).toEqual(note);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
          createEngine: createEngineFromServer,
        }
      );
    });
  });
});
