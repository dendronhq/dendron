import { DEngineClient, DVault, NoteUtils } from "@dendronhq/common-all";
import { setupEngine, SetupEngineResp } from "@dendronhq/dendron-cli";
import _ from "lodash";
import {
  createEngineFromServer,
  ENGINE_HOOKS,
  runEngineTestV5,
} from "../../..";

const createEngine = createEngineFromServer;

describe("GIVEN setupEngine", () => {
  describe("WHEN --fast option", () => {
    let resp: SetupEngineResp;
    let wsRoot: string;
    let vault: DVault;
    let engine: DEngineClient;

    beforeEach(async () => {
      await runEngineTestV5(
        async (opts) => {
          wsRoot = opts.wsRoot;
          vault = opts.vaults[0];
          engine = opts.engine;
          resp = await setupEngine({
            wsRoot,
            noWritePort: true,
            target: "cli",
            fast: true,
            useLocalEngine: true,
          });
          return;
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    afterEach(async () => {
      return new Promise((resolve) => {
        resp.server.close(() => {
          resolve(undefined);
        });
      });
    });

    test("THEN do not initialize engine", async () => {
      // notes should be equal
      expect(resp.engine.notes).toEqual({});
    });

    test("THEN write new note should add new note", async () => {
      // notes should be equal
      const sampleNote = NoteUtils.create({ fname: "bar", vault });
      await resp.engine.writeNote(sampleNote);
      expect(resp.engine.notes).toEqual({ [sampleNote.id]: sampleNote });
    });

    test("THEN write existing note should update existing note", async () => {
      // notes should be equal
      const sampleNote = NoteUtils.create({
        fname: "foo",
        vault,
        body: "udpated foo",
      });
      const fooOrig = _.cloneDeep(engine.notes["foo"]);
      await resp.engine.writeNote(sampleNote, { updateExisting: true });
      expect(resp.engine.notes["foo"]).toMatchObject({
        ..._.omit(fooOrig, ["contentHash"]),
        body: "updated foo",
      });
    });
  });

  describe("WHEN --attach option", () => {
    test("THEN attach to running engine", (done) => {
      jest.setTimeout(15000);
      runEngineTestV5(
        async ({ wsRoot, engine, port }) => {
          const resp = await setupEngine({
            wsRoot,
            noWritePort: true,
            attach: true,
            target: "cli",
          });
          expect(resp.engine.notes).toEqual(engine.notes);
          expect(resp.port).toEqual(port);
          resp.server.close(() => {
            done();
          });
        },
        {
          expect,
          createEngine,
        }
      );
    });
  });
});
