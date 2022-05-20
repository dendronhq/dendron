import { CONSTANTS, NoteProps, NoteUtils } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  TestPresetEntryV4,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import {
  DendronEngineClient,
  NotesFileSystemCache,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { setupBasic } from "./utils";

const NOTES = {
  NOTE_NO_CHILDREN: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const vault = vaults[0];
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const noteOld = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      const cnote = _.clone(noteOld);
      cnote.body = "new body";
      await engine.updateNote(cnote);
      const noteNew = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      await engine.init();

      return [
        {
          actual: _.trim(noteOld.body),
          expected: "foo body",
        },
        {
          actual: _.trim(noteNew.body),
          expected: "new body",
        },
        {
          actual: keySet.size,
          expected: 2,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({ wsRoot, vault: vaults[0] });
      },
    }
  ),
  NOTE_UPDATE_CHILDREN: new TestPresetEntryV4(
    async ({ vaults, wsRoot, engine }) => {
      const vault = vaults[0];
      const logger = (engine as DendronEngineClient).logger;
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({ cachePath, logger });
      const keySet = notesCache.getCacheEntryKeys();
      const noteOld = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      const cnote = _.clone(noteOld);
      cnote.children = ["random note"];
      await engine.updateNote(cnote);
      const noteNew = NoteUtils.getNoteByFnameFromEngine({
        fname: "foo",
        engine,
        vault,
      }) as NoteProps;
      await engine.init();

      return [
        {
          actual: noteOld.children[0],
          expected: "foo.ch1",
        },
        {
          actual: noteNew.children[0],
          expected: "random note",
        },
        {
          actual: keySet.size,
          expected: 4,
        },
        {
          actual: new NotesFileSystemCache({
            cachePath,
            logger,
          }).getCacheEntryKeys().size,
          expected: 4,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
};
export const ENGINE_UPDATE_PRESETS = {
  NOTES,
};
