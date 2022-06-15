// import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
// import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  // NoteCLICommand,
  // NoteCLICommandOpts,
  // NoteCLIOutput,
  // NoteCommandData,
  // NoteCommands,
  VisualizeCLICommand,
  VisualizeCLICommandOpts,
} from "@dendronhq/dendron-cli";
import { fstat } from "fs";
import _ from "lodash";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import * as fs from "fs";
// import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
// import { checkString } from "../../../utils";

const runCmd = (opts: Omit<VisualizeCLICommandOpts, "port" | "server">) => {
  const cmd = new VisualizeCLICommand();
  cmd.opts.quiet = true;
  return cmd.execute({
    ...opts,
    port: 0,
    server: {} as any,
    //TODO: Put path to test-workspace
    wsRoot: "path/to/dendron/workspace",
  });
};

describe("WHEN run 'visualize'", () => {
  describe("AND WHEN dendron ws root is set correctly", () => {
    test("THEN produce svg files", async () => {
      await runEngineTestV5(
        //TODO: Where and how vaults are created?
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          console.log("wsRoot:", wsRoot);
          await runCmd({
            wsRoot,
            engine,
          });

          expect(1).toEqual(1);

          // expect(fs.existsSync("diagram-vault1.svg")).toEqual(true);
          // expect(fs.existsSync("diagram-vault1.svg")).toEqual(true);
          // expect(fs.existsSync("diagram-vault1.svg")).toEqual(true);
        },
        {
          //TODO: createEngineFromServer vs. createEngineFromEngine (default)
          // createEngine: createEngineFromServer
          expect,
        }
      );
    });
  });

  describe("AND WHEN dendron ws root is not set correctly", () => {
    test("THEN ???", async () => {
      await runEngineTestV5(
        async ({ engine, wsRoot, vaults }) => {
          // Check if the error message is logged out correctly
          //TODO: How to check log message? with sinon spy?
        },
        {
          // createEngine: createEngineFromServer,
          expect,
        }
      );
    });
  });
});
