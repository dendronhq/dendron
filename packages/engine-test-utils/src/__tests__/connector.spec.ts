import { EngineConnector } from "@dendronhq/engine-server";
import _ from "lodash";
import { createEngineFromServer, runEngineTestV5 } from "../engine";
import { ENGINE_HOOKS } from "../presets";

describe.skip("connector", () => {
  test("basic: direct init", async () => {
    await runEngineTestV5(
      async ({ wsRoot }) => {
        const connector = await EngineConnector.getOrCreate({
          wsRoot,
          force: true,
        });
        await connector.init();
        const engineNotes = await connector.engine.findNotesMeta({
          excludeStub: false,
        });
        expect(engineNotes.length).toEqual(5);
      },
      {
        expect,
        createEngine: createEngineFromServer,
        //createEngine,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  }, 9000);

  test("basic: wait for init", async (done) => {
    let connector: EngineConnector;
    await runEngineTestV5(
      async () => {
        connector.init({
          onReady: async () => {
            const engineNotes = await connector.engine.findNotesMeta({
              excludeStub: false,
            });
            expect(engineNotes.length).toEqual(5);
            done();
          },
        });
      },
      {
        expect,
        createEngine: createEngineFromServer,
        preSetupHook: async (opts) => {
          connector = await EngineConnector.getOrCreate({
            wsRoot: opts.wsRoot,
            force: true,
          });
          await ENGINE_HOOKS.setupBasic(opts);
        },
      }
    );
  }, 9000);
});
