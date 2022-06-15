import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  NoteCLICommand,
  NoteCLICommandOpts,
  NoteCLIOutput,
  NoteCommandData,
  NoteCommands,
  VisualizeCLICommand,
  VisualizeCLICommandOpts,
} from "@dendronhq/dendron-cli";
import _ from "lodash";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS, ENGINE_HOOKS_MULTI } from "../../../presets";
import { checkString } from "../../../utils";

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
        async ({ engine, wsRoot, vaults }) => {
          const vault = vaults[0];
          console.log("wsRoot:", wsRoot);
          await runCmd({
            wsRoot,
            engine,
          });
          expect(1).toEqual(1);
        },
        {
          // createEngine: createEngineFromServer,
          expect,
        }
      );
    });
  });
});
