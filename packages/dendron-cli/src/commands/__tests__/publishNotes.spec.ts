import { ENGINE_HOOKS, runEngineTestV4 } from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import fs from "fs";
import path from "path";
import { PublishNotesCommand } from "../publishNotes";

describe("publishNotes", async () => {
  test("publish, no push", async () => {
    await runEngineTestV4(
      async ({ vaults, wsRoot }) => {
        const { buildNotesRoot } = await PublishNotesCommand.run({
          wsRoot,
          vault: vaults[0],
          noPush: true,
        });
        const notesDir = path.join(buildNotesRoot, "notes");
        expect(fs.readdirSync(notesDir).length).toEqual(4);
      },
      {
        createEngine,
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        singleVault: true,
      }
    );
  });

  test("publish but no git", async () => {
    await runEngineTestV4(
      async ({ vaults, wsRoot }) => {
        try {
          await PublishNotesCommand.run({
            wsRoot,
            vault: vaults[0],
          });
        } catch (err) {
          expect(err.message).toEqual("no repo found");
        }
      },
      {
        createEngine,
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
        singleVault: true,
      }
    );
  });
});
